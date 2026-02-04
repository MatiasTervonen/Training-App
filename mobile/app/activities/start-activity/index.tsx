import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import ActivityDropdown from "@/features/activities/components/activityDropdown";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Toast from "react-native-toast-message";
import { View, ScrollView, Linking, AppState } from "react-native";
import SubNotesInput from "@/components/SubNotesInput";
import Timer from "@/components/timer";
import Toggle from "@/components/toggle";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Link } from "expo-router";
import { useTimerStore } from "@/lib/stores/timerStore";
import AnimatedButton from "@/components/buttons/animatedButton";
import useSaveDraft from "@/features/activities/hooks/useSaveDraft";
import FullScreenLoader from "@/components/FullScreenLoader";
import SaveButton from "@/components/buttons/SaveButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useSaveActivitySession from "@/features/activities/hooks/useSaveSession";
import DeleteButton from "@/components/buttons/DeleteButton";
import { Fullscreen } from "lucide-react-native";
import {
  useStartGPStracking,
  useStopGPStracking,
} from "@/features/activities/lib/location-actions";
import { formatDateShort } from "@/lib/formatDate";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import FullScreenMapModal from "@/features/activities/components/fullScreenMapModal";
import BaseMap from "@/features/activities/components/baseMap";
import { TrackPoint } from "@/types/session";
import InfoModal from "@/features/activities/components/infoModal";
import { useDistanceFromTrack } from "@/features/activities/hooks/useCountDistance";
import { useStartActivity } from "@/features/activities/hooks/useStartActivity";
import { clearLocalSessionDatabase } from "@/features/activities/lib/database-actions";
import { useTrackHydration } from "@/features/activities/hooks/useTrackHydration";
import { useForegroundLocationTracker } from "@/features/activities/hooks/useForegroundLocationTracker";
import { usePersistToDatabase } from "@/features/activities/hooks/usePersistToDatabase";
import { useMovingTimeFromTrack } from "@/features/activities/hooks/useMovingTimeFromTrack";
import { useAveragePace } from "@/features/activities/hooks/useAveragePace";
import StepInfoModal from "@/features/activities/stepToggle/stepInfoModal";
import { hasStepsPermission } from "@/features/activities/stepToggle/stepPermission";
import { useStepHydration } from "@/features/activities/hooks/useStepHydration";
import { updateNativeTimerLabel } from "@/native/android/NativeTimer";
import { useTemplateRoute } from "@/features/activities/hooks/useTemplateRoute";
import { findWarmupStartIndex } from "@/features/activities/lib/findWarmupStartIndex";
import { useTranslation } from "react-i18next";

export default function StartActivityScreen() {
  const { t } = useTranslation(["activities", "timer"]);
  const now = formatDateShort(new Date());

  // Helper function to get translated activity name
  const getActivityName = (name: string, slug?: string | null) => {
    if (slug) {
      const translated = t(`activities.activityNames.${slug}`, {
        defaultValue: "",
      });
      if (translated && translated !== `activities.activityNames.${slug}`) {
        return translated;
      }
    }
    return name;
  };
  const [activityName, setActivityName] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [allowGPS, setAllowGPS] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [track, setTrack] = useState<TrackPoint[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [hasStartedTracking, setHasStartedTracking] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [steps, setSteps] = useState(0);
  const [showStepToggle, setShowStepToggle] = useState(false);
  const [stepsAllowed, setStepsAllowed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // DEBUG: Monitor track state changes - shows toast when track length changes
  const prevTrackLenRef = useRef(track.length);
  useEffect(() => {
    const prevLen = prevTrackLenRef.current;
    // Only toast on significant changes to avoid spam
    if (track.length !== prevLen && (track.length === 0 || prevLen === 0 || Math.abs(track.length - prevLen) > 5)) {
      Toast.show({
        type: track.length > prevLen ? "success" : "error",
        text1: `Track: ${prevLen} → ${track.length}`,
        text2: `isHydrated: ${isHydrated}`,
        visibilityTime: 3000,
      });
    }
    prevTrackLenRef.current = track.length;
  }, [track.length, isHydrated]);

  const gpsEnabledGlobally = useUserStore(
    (state) => state.settings?.gps_tracking_enabled,
  );

  const setSwipeEnabled = useModalPageConfig((state) => state.setSwipeEnabled);

  // Use selectors to avoid re-rendering every second when uiTick changes
  const clearEverything = useTimerStore((state) => state.clearEverything);
  const isRunning = useTimerStore((state) => state.isRunning);
  const remainingMs = useTimerStore((state) => state.remainingMs);
  const startTimestamp = useTimerStore((state) => state.startTimestamp);
  const activeSession = useTimerStore((state) => state.activeSession);
  const setActiveSession = useTimerStore((state) => state.setActiveSession);
  const mode = useTimerStore((state) => state.mode);

  // Restore GPS and steps settings from persisted activeSession on mount
  useEffect(() => {
    if (activeSession) {
      setAllowGPS(activeSession.gpsAllowed ?? false);
      setStepsAllowed(activeSession.stepsAllowed ?? false);
    }
  }, [activeSession]);

  // Sync title changes to activeSession and native timer notification
  useEffect(() => {
    if (
      activeSession &&
      activeSession.type === activityName &&
      activeSession.label !== title
    ) {
      setActiveSession({
        ...activeSession,
        label: title,
      });
    }
    if (startTimestamp && mode) {
      const statusText =
        mode === "countdown"
          ? t("timer:timer.notification.timeRemaining")
          : t("timer:timer.notification.inProgress");
      updateNativeTimerLabel(startTimestamp, title, mode, statusText);
    }
  }, [
    title,
    activeSession,
    setActiveSession,
    startTimestamp,
    mode,
    t,
    activityName,
  ]);

  // check if steps permission is granted and show/hide the step toggle
  useEffect(() => {
    const checkStepsPermission = async () => {
      const granted = await hasStepsPermission();
      setShowStepToggle(!granted);
      setStepsAllowed(granted);
    };

    // Initial check when screen mounts
    checkStepsPermission();

    // Re-check when app returns to foreground
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkStepsPermission();
      }
    });

    return () => sub.remove();
  }, []);

  const resetSession = async () => {
    clearEverything();
    AsyncStorage.removeItem("activity_draft");
    setTitle("");
    setNotes("");
    setActivityName("");
    setAllowGPS(false);
    setTrack([]);
    setSteps(0);
    replaceFromHydration([]);
    setRoute([]);
    setHasStartedTracking(false);
    // stop the GPS tracking
    await stopGPStracking();

    // Wait briefly to ensure any pending database writes complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    await clearLocalSessionDatabase();
  };

  //  useSaveDraft hook to save the activity draft
  useSaveDraft({
    title,
    notes,
    setTitle,
    setNotes,
    setActivityName,
  });

  // useStartGPStracking hook to start the GPS tracking and useStopGPStracking hook to stop the GPS tracking
  const { startGPStracking } = useStartGPStracking();
  const { stopGPStracking } = useStopGPStracking();

  // useStartActivity hook to start the activity
  const { startActivity } = useStartActivity({
    activityName,
    title,
    allowGPS,
    stepsAllowed,
  });

  const warmupStartIndex = useMemo(() => findWarmupStartIndex(track), [track]);

  const trustedPoints = useMemo(() => {
    if (warmupStartIndex === null) return [];

    return track.slice(warmupStartIndex).filter((p) => !p.isStationary);
  }, [track, warmupStartIndex]);

  // useCountDistance hook to count the total distance
  const { meters } = useDistanceFromTrack(trustedPoints);

  // useMovingTimeFromTrack hook to count the moving time
  const movingTimeSeconds = useMovingTimeFromTrack(trustedPoints);

  // useCountAveragePace hook to count the average pace from moving time
  const averagePacePerKm = useAveragePace(meters, movingTimeSeconds ?? 0);

  // useSaveActivitySession hook to save the activity session
  const { handleSaveSession } = useSaveActivitySession({
    title,
    notes,
    meters,
    setIsSaving,
    resetSession,
  });

  useEffect(() => {
    return () => {
      setSwipeEnabled(true);
    };
  }, [setSwipeEnabled]);

  // when point arrives add it to the track and persist it to the database
  const { addPoint, replaceFromHydration } = usePersistToDatabase();

  // Memoize the hydration callback to prevent unnecessary database calls
  const handleHydrated = useCallback(
    (points: TrackPoint[]) => {
      replaceFromHydration(points);
      setIsHydrated(true);
    },
    [replaceFromHydration],
  );

  // when foreground resumes from background, hydrate the track from the database
  useTrackHydration({
    setTrack,
    onHydrated: handleHydrated,
    setIsHydrated,
  });

  // when foreground resumes from background, hydrate the steps from the health connect
  useStepHydration({
    setSteps,
    stepsAllowed,
  });

  // useTemplateRoute hook to get the template route
  const { route, setRoute, isLoadingTemplateRoute } = useTemplateRoute();

  // When foreground watch gps
  const { isGpsWarmingUp, currentPosition } = useForegroundLocationTracker({
    allowGPS,
    isRunning,
    setHasStartedTracking,
    hasStartedTracking,
    isHydrated,
    track,
    onPoint: (point) => {
      setTrack((prev) => [...prev, point]);
      addPoint(point);
    },
  });

  const hasSessionStarted =
    remainingMs !== null || startTimestamp !== null || route.length > 0;

  return (
    <>
      {!hasSessionStarted ? (
        <PageContainer>
          <AppText className="text-2xl text-center mb-5">
            {t("activities.startActivityScreen.selectActivity")}
          </AppText>
          <ActivityDropdown
            onSelect={async (activity) => {
              const translatedName = getActivityName(
                activity.name,
                activity.slug,
              );
              setActivityName(translatedName);
              setTitle(`${translatedName} - ${now}`);

              await AsyncStorage.mergeItem(
                "activity_draft",
                JSON.stringify({
                  activityId: activity.id,
                  activityName: activity.name,
                }),
              );
            }}
          />
          <View className="flex-row items-center my-10  justify-between px-4">
            {allowGPS ? (
              <AppText className="text-lg">
                {t("activities.startActivityScreen.disableLocationTracking")}
              </AppText>
            ) : (
              <Link href="/menu/settings">
                <AppText className="text-lg">
                  {t("activities.startActivityScreen.enableLocationTracking")}
                </AppText>
              </Link>
            )}
            <Toggle
              disabled={isRunning}
              isOn={allowGPS}
              onToggle={async () => {
                if (!gpsEnabledGlobally) {
                  setShowModal(true);
                  return;
                }

                setAllowGPS((prev) => !prev);
              }}
            />
          </View>
          {showStepToggle && (
            <View className="flex-row items-center mb-10 justify-between px-4">
              <AppText className="text-lg">
                {t("activities.startActivityScreen.enableStepsTracking")}
              </AppText>
              <Toggle
                disabled={isRunning}
                isOn={false}
                onToggle={async () => {
                  setShowStepsModal(true);
                }}
              />
            </View>
          )}
          <AnimatedButton
            label={t("activities.startActivityScreen.startButton")}
            onPress={startActivity}
            className="justify-center items-center py-2 bg-blue-800 rounded-md shadow-md border-2 border-blue-500"
            textClassName="text-gray-100 text-center"
          />
        </PageContainer>
      ) : (
        <>
          <View className="flex items-center bg-gray-600 p-2 px-4 w-full z-40 ticky top-0">
            <Timer
              textClassName="text-xl"
              manualSession={{
                label: title,
                path: "/activities/start-activity",
                type: "activity",
              }}
              onStart={allowGPS ? startGPStracking : undefined}
              onPause={allowGPS ? stopGPStracking : undefined}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
          >
            <PageContainer className="justify-between">
              <View className="flex-1 justify-between">
                <View>
                  <View className="flex-row items-center justify-between mb-5">
                    {allowGPS ? (
                      <AnimatedButton
                        onPress={() => setFullScreen(!fullScreen)}
                        className="p-2 rounded-full bg-blue-700"
                        hitSlop={10}
                      >
                        <Fullscreen size={20} color="#f3f4f6" />
                      </AnimatedButton>
                    ) : (
                      <View className="w-10" />
                    )}
                    <AppText className="text-2xl text-center">
                      {activityName}
                    </AppText>
                    <View className="w-10" />
                  </View>
                  <View className="w-full gap-4">
                    <AppInput
                      label={t(
                        "activities.startActivityScreen.sessionNameLabel",
                      )}
                      value={title}
                      setValue={setTitle}
                      placeholder={t(
                        "activities.startActivityScreen.sessionNamePlaceholder",
                      )}
                    />
                    <SubNotesInput
                      label={t(
                        "activities.startActivityScreen.sessionNotesLabel",
                      )}
                      value={notes}
                      setValue={setNotes}
                      placeholder={t(
                        "activities.startActivityScreen.sessionNotesPlaceholder",
                      )}
                      className="min-h-[60px]"
                    />
                  </View>
                </View>

                {allowGPS && (
                  <BaseMap
                    track={track}
                    templateRoute={route}
                    setScrollEnabled={setScrollEnabled}
                    setSwipeEnabled={setSwipeEnabled}
                    title={title}
                    startGPStracking={startGPStracking}
                    stopGPStracking={stopGPStracking}
                    totalDistance={meters}
                    hasStartedTracking={hasStartedTracking}
                    averagePacePerKm={averagePacePerKm}
                    currentStepCount={steps}
                    isLoadingTemplateRoute={isLoadingTemplateRoute}
                    isLoadingPosition={
                      (isRunning && track.length === 0) || isGpsWarmingUp
                    }
                    currentPosition={currentPosition}
                  />
                )}
                <View className="gap-5 mt-10">
                  <SaveButton
                    label={t("activities.startActivityScreen.finishActivity")}
                    onPress={handleSaveSession}
                  />
                  <DeleteButton
                    label={t("activities.startActivityScreen.delete")}
                    onPress={resetSession}
                  />
                </View>
              </View>
            </PageContainer>
          </ScrollView>
        </>
      )}

      {allowGPS && (
        <FullScreenMapModal
          fullScreen={fullScreen}
          track={track}
          templateRoute={route}
          setFullScreen={setFullScreen}
          startGPStracking={startGPStracking}
          stopGPStracking={stopGPStracking}
          totalDistance={meters}
          hasStartedTracking={hasStartedTracking}
          averagePacePerKm={averagePacePerKm}
          currentStepCount={steps}
          currentPosition={currentPosition}
        />
      )}

      <InfoModal showModal={showModal} onCancel={() => setShowModal(false)} />

      <StepInfoModal
        visible={showStepsModal}
        onCancel={() => setShowStepsModal(false)}
        onOpenSettings={async () => {
          try {
            const supported = await Linking.canOpenURL(
              "healthconnect://settings",
            );

            if (supported) {
              await Linking.openURL("healthconnect://settings");
            } else {
              await Linking.openSettings();
            }
          } catch {
            await Linking.openSettings();
          } finally {
            setShowStepsModal(false);
          }
        }}
      />

      <FullScreenLoader
        visible={isSaving}
        message={t("activities.startActivityScreen.savingSession")}
      />
    </>
  );
}
