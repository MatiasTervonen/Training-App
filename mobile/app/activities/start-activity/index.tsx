import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import ActivityDropdown from "@/features/activities/components/activityDropdown";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { View, AppState, ScrollView, Pressable } from "react-native";
import SubNotesInput from "@/components/SubNotesInput";
import Toggle from "@/components/toggle";
import SessionStats from "@/features/activities/components/sessionStats";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Link, router } from "expo-router";
import { useTimerStore } from "@/lib/stores/timerStore";
import AnimatedButton from "@/components/buttons/animatedButton";
import useSaveDraft from "@/features/activities/hooks/useSaveDraft";
import FullScreenLoader from "@/components/FullScreenLoader";
import SaveButton from "@/components/buttons/SaveButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useSaveActivitySession from "@/features/activities/hooks/useSaveSession";
import DeleteButton from "@/components/buttons/DeleteButton";
import {
  useStartGPStracking,
  useStopGPStracking,
} from "@/features/activities/lib/location-actions";
import { formatDateShort } from "@/lib/formatDate";
import FullScreenMap from "@/features/activities/components/fullScreenMap";
import { TrackPoint, DraftRecording } from "@/types/session";
import InfoModal from "@/components/InfoModal";
import { useDistanceFromTrack } from "@/features/activities/hooks/useCountDistance";
import { useStartActivity } from "@/features/activities/hooks/useStartActivity";
import { clearLocalSessionDatabase } from "@/features/activities/lib/database-actions";
import { useTrackHydration } from "@/features/activities/hooks/useTrackHydration";
import { useForegroundLocationTracker } from "@/features/activities/hooks/useForegroundLocationTracker";
import { usePersistToDatabase } from "@/features/activities/hooks/usePersistToDatabase";
import { useMovingTimeFromTrack } from "@/features/activities/hooks/useMovingTimeFromTrack";
import { useAveragePace } from "@/features/activities/hooks/useAveragePace";
import { hasStepsPermission } from "@/features/activities/stepToggle/stepPermission";
import { useStepHydration } from "@/features/activities/hooks/useStepHydration";
import { useLiveStepCounter } from "@/features/activities/hooks/useLiveStepCounter";
import {
  requestStepPermission,
  hasStepSensor,
  isStepPermissionPermanentlyDenied,
} from "@/native/android/NativeStepCounter";
import { updateNativeTimerLabel } from "@/native/android/NativeTimer";
import { useTemplateRoute } from "@/features/activities/hooks/useTemplateRoute";
import { findWarmupStartIndex } from "@/features/activities/lib/findWarmupStartIndex";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { useTranslation } from "react-i18next";
import NotesModal from "@/features/activities/components/notesModal";
import { nanoid } from "nanoid/non-secure";
import RecordVoiceNotes from "@/features/notes/components/RecordVoiceNotes";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import { useConfirmAction } from "@/lib/confirmAction";
import { debugLog } from "@/features/activities/lib/debugLogger";
import DebugOverlay from "@/features/activities/components/debugOverlay";
import { getWeight } from "@/database/weight/get-weight";
import {
  isIgnoringBatteryOptimizations,
  requestIgnoreBatteryOptimizations,
} from "@/native/android/NativeBatteryOptimization";
import AppTextNC from "@/components/AppTextNC";

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
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [hasStartedTracking, setHasStartedTracking] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [steps, setSteps] = useState(0);
  const [showStepToggle, setShowStepToggle] = useState(false);
  const [stepsAllowed, setStepsAllowed] = useState(false);
  const [stepsPermanentlyDenied, setStepsPermanentlyDenied] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [draftRecordings, setDraftRecordings] = useState<DraftRecording[]>([]);
  const [baseMet, setBaseMet] = useState(0);
  const [showBatteryHint, setShowBatteryHint] = useState(false);

  const confirmAction = useConfirmAction();

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
  const hasActiveSession = !!activeSession;
  const sessionGpsAllowed = activeSession?.gpsAllowed ?? false;
  const sessionStepsAllowed = activeSession?.stepsAllowed ?? false;

  useEffect(() => {
    if (hasActiveSession) {
      setAllowGPS(sessionGpsAllowed);
      setStepsAllowed(sessionStepsAllowed);
    }
  }, [hasActiveSession, sessionGpsAllowed, sessionStepsAllowed]);

  // Check battery optimization status when GPS is enabled or app returns to foreground
  useEffect(() => {
    if (!allowGPS) {
      setShowBatteryHint(false);
      return;
    }

    const check = () => {
      isIgnoringBatteryOptimizations().then((ignoring) => {
        setShowBatteryHint(!ignoring);
      });
    };

    check();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });

    return () => sub.remove();
  }, [allowGPS]);

  // Keep a ref to the latest activeSession for use inside effects
  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;

  // Sync title changes to activeSession and native timer notification
  useEffect(() => {
    const session = activeSessionRef.current;
    if (
      session &&
      session.type === activityName &&
      session.label !== title
    ) {
      setActiveSession({
        ...session,
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
  }, [title, setActiveSession, startTimestamp, mode, t, activityName]);

  // Fetch latest user weight (cached by React Query, default 70kg matching RPC)
  const { data: weightData } = useQuery({
    queryKey: ["latestWeight"],
    queryFn: getWeight,
  });
  const userWeight = weightData?.[0]?.weight ?? 70;

  // check if steps permission is granted and show/hide the step toggle
  useEffect(() => {
    const checkStepsPermission = async () => {
      const sensorExists = await hasStepSensor();
      if (!sensorExists) {
        setShowStepToggle(false);
        setStepsAllowed(false);
        return;
      }

      const granted = await hasStepsPermission();
      setShowStepToggle(!granted);
      setStepsAllowed(granted);

      if (!granted) {
        const denied = await isStepPermissionPermanentlyDenied();
        setStepsPermanentlyDenied(denied);
      } else {
        setStepsPermanentlyDenied(false);
      }
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
    setBaseMet(0);
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
    draftRecordings,
    setTitle,
    setNotes,
    setActivityName,
    setDraftRecordings,
    setBaseMet,
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

  // Live calorie estimation: same formula as RPC compute-stats.sql
  const liveCalories = useMemo(() => {
    if (!baseMet || !userWeight) return 0;
    return Math.round(baseMet * userWeight * ((movingTimeSeconds ?? 0) / 3600));
  }, [baseMet, userWeight, movingTimeSeconds]);

  // useSaveActivitySession hook to save the activity session
  const { handleSaveSession } = useSaveActivitySession({
    title,
    notes,
    meters,
    draftRecordings,
    setIsSaving,
    resetSession,
  });

  // when point arrives add it to the track and persist it to the database
  const { addPoint, replaceFromHydration } = usePersistToDatabase();

  // Memoize the hydration callback to prevent unnecessary database calls
  const handleHydrated = useCallback(
    (points: TrackPoint[]) => {
      debugLog(
        "MAIN",
        `handleHydrated: ${points.length} pts, setting isHydrated=true`,
      );
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

  // Live step-by-step updates while in the foreground
  useLiveStepCounter({
    enabled: stepsAllowed && !!activeSession,
    setSteps,
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
      setTrack((prev) => {
        debugLog("MAIN", `onPoint: track ${prev.length} → ${prev.length + 1}`);
        return [...prev, point];
      });
      addPoint(point);
    },
  });

  const hasSessionStarted =
    remainingMs !== null || startTimestamp !== null || route.length > 0;

  // Disable swipe navigation when GPS session is active (map needs all touch gestures)
  useEffect(() => {
    if (hasSessionStarted && allowGPS) {
      setSwipeEnabled(false);
    }
    return () => setSwipeEnabled(true);
  }, [hasSessionStarted, allowGPS, setSwipeEnabled]);

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
              setBaseMet(activity.base_met);

              await AsyncStorage.mergeItem(
                "activity_draft",
                JSON.stringify({
                  activityId: activity.id,
                  activityName: translatedName,
                  activitySlug: activity.slug ?? null,
                  baseMet: activity.base_met,
                }),
              );
            }}
          />
          <View className="flex-row items-center my-7  justify-between px-4">
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
          {showBatteryHint && (
            <Pressable
              className="px-4 -mt-4 mb-4"
              onPress={() => requestIgnoreBatteryOptimizations()}
            >
              <AppTextNC className="text-sm text-blue-500 underline">
                {t("activities.startActivityScreen.batteryOptHint")}
              </AppTextNC>
            </Pressable>
          )}
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
      ) : allowGPS ? (
        <View className="flex-1">
          <FullScreenMap
            track={track}
            templateRoute={route}
            startGPStracking={startGPStracking}
            stopGPStracking={stopGPStracking}
            totalDistance={meters}
            title={title}
            hasStartedTracking={hasStartedTracking}
            averagePacePerKm={averagePacePerKm}
            currentStepCount={steps}
            isLoadingTemplateRoute={isLoadingTemplateRoute}
            isLoadingPosition={
              (isRunning && track.length === 0) || isGpsWarmingUp
            }
            currentPosition={currentPosition}
            isHydrated={isHydrated}
            liveCalories={liveCalories}
            onNotesPress={() => setShowNotesModal(true)}
          />
          <DebugOverlay
            trackLength={track.length}
            isHydrated={isHydrated}
            isGpsWarmingUp={isGpsWarmingUp}
          />
          <View className="flex-row gap-5 px-5 pt-2 pb-3 bg-slate-950">
            <View className="flex-1 shrink-0">
              <DeleteButton
                label={t("activities.startActivityScreen.delete")}
                onPress={resetSession}
              />
            </View>
            <View className="flex-1 shrink-0">
              <SaveButton
                label={t("activities.startActivityScreen.finishActivity")}
                onPress={handleSaveSession}
              />
            </View>
          </View>
        </View>
      ) : (
        <>
          <SessionStats
            title={title || "Activity"}
            currentStepCount={steps}
            liveCalories={liveCalories}
          />

          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View className="flex-1 justify-between p-5 ">
              <View>
                <View className="flex-row items-center justify-between mb-5">
                  <AppText className="text-2xl text-center flex-1">
                    {activityName}
                  </AppText>
                  <View className="w-10" />
                </View>
                <View className="w-full gap-4">
                  <AppInput
                    label={t("activities.startActivityScreen.sessionNameLabel")}
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
                  />
                </View>
                {draftRecordings.length > 0 && (
                  <View className="mt-5">
                    <AppText className=" mb-2">
                      {t("notes:notes.recordings")}
                    </AppText>
                    {draftRecordings.map((recording, index) => (
                      <DraftRecordingItem
                        key={recording.id}
                        uri={recording.uri}
                        durationMs={recording.durationMs}
                        deleteRecording={async () => {
                          const confirm = await confirmAction({
                            title: t("notes:notes.deleteRecordingTitle"),
                            message: t("notes:notes.deleteRecordingMessage"),
                          });
                          if (!confirm) return;

                          setDraftRecordings((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                        }}
                      />
                    ))}
                  </View>
                )}
                <View className="mt-6">
                  <RecordVoiceNotes
                    onRecordingComplete={(uri, duration) => {
                      const newRecording = {
                        id: nanoid(),
                        uri,
                        createdAt: Date.now(),
                        durationMs: duration,
                      };
                      setDraftRecordings((prev) => [...prev, newRecording]);
                    }}
                  />
                </View>
              </View>
              <View className="flex-row gap-5 mt-20">
                <View className="flex-1 shrink-0">
                  <DeleteButton
                    label={t("activities.startActivityScreen.delete")}
                    onPress={resetSession}
                  />
                </View>
                <View className="flex-1 shrink-0">
                  <SaveButton
                    label={t("activities.startActivityScreen.finishActivity")}
                    onPress={handleSaveSession}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </>
      )}

      <InfoModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={t("activities.infoModal.locationTrackingDisabled")}
        description={t("activities.infoModal.enableLocationMessage")}
        cancelLabel={t("activities.infoModal.cancel")}
        confirmLabel={t("activities.infoModal.settings")}
        onConfirm={() => {
          setShowModal(false);
          router.push("/menu/settings");
        }}
      />

      <InfoModal
        visible={showStepsModal}
        onClose={() => setShowStepsModal(false)}
        title={t("activities.stepInfoModal.title")}
        description={
          stepsPermanentlyDenied
            ? t("activities.stepInfoModal.descriptionSettings")
            : t("activities.stepInfoModal.description")
        }
        cancelLabel={t("activities.stepInfoModal.cancel")}
        confirmLabel={
          stepsPermanentlyDenied
            ? t("activities.stepInfoModal.goToSettings")
            : t("activities.stepInfoModal.openSettings")
        }
        onConfirm={async () => {
          try {
            await requestStepPermission();
          } catch {
            // Permission request failed
          } finally {
            setShowStepsModal(false);
          }
        }}
      />

      <NotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        activityName={activityName}
        title={title}
        setTitle={setTitle}
        notes={notes}
        setNotes={setNotes}
        draftRecordings={draftRecordings}
        setDraftRecordings={setDraftRecordings}
      />

      <FullScreenLoader
        visible={isSaving}
        message={t("activities.startActivityScreen.savingSession")}
      />
    </>
  );
}
