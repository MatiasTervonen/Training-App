import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import ActivityDropdown from "@/Features/activities/activityDropdown";
import { useState, useEffect } from "react";
import { View, ScrollView, Button } from "react-native";
import SubNotesInput from "@/components/SubNotesInput";
import Timer from "@/components/timer";
import Toggle from "@/components/toggle";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Link } from "expo-router";
import { useTimerStore } from "@/lib/stores/timerStore";
import AnimatedButton from "@/components/buttons/animatedButton";
import useSaveDraft from "@/Features/activities/hooks/useSaveDraft";
import FullScreenLoader from "@/components/FullScreenLoader";
import SaveButton from "@/components/buttons/SaveButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useSaveActivitySession from "@/Features/activities/hooks/useSaveSession";
import DeleteButton from "@/components/buttons/DeleteButton";
import { Fullscreen } from "lucide-react-native";
import {
  useStartGPStracking,
  useStopGPStracking,
} from "@/Features/activities/lib/location-actions";
import { formatDate } from "@/lib/formatDate";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import FullScreenMapModal from "@/Features/activities/fullScreenMapModal";
import BaseMap from "@/Features/activities/baseMap";
import { TrackPoint } from "@/types/session";
import InfoModal from "@/Features/activities/infoModal";
import { useDistanceFromTrack } from "@/Features/activities/hooks/useDistanceFromTrack";
import { useStartActivity } from "@/Features/activities/hooks/useStartActivity";
import { getDatabase } from "@/database/local-database/database";
import { clearLocalSessionDatabase } from "@/Features/activities/lib/database-actions";
import { useTrackHydration } from "@/Features/activities/hooks/useTrackHydration";
import { useForegroundLocationTracker } from "@/Features/activities/hooks/useForegroundLocationTracker";
import { usePersistToDatabase } from "@/Features/activities/hooks/usePersistToDatabase";
import { useMovingTimeFromTrack } from "@/Features/activities/hooks/useMovingTimeFromTrack";
import { useAveragePace } from "@/Features/activities/hooks/useAveragePace";

export default function StartActivityScreen() {
  const now = formatDate(new Date());
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

  const gpsEnabledGlobally = useUserStore(
    (state) => state.settings?.gps_tracking_enabled
  );

  const setSwipeEnabled = useModalPageConfig((state) => state.setSwipeEnabled);

  const { elapsedTime, stopTimer, isRunning } = useTimerStore();

  const resetSession = async () => {
    stopTimer();
    AsyncStorage.removeItem("activity_draft");
    setTitle("");
    setNotes("");
    setActivityName("");
    setAllowGPS(false);
    setTrack([]);
    replaceFromFydration([]);
    // stop the GPS tracking
    await stopGPStracking();

    await clearLocalSessionDatabase();
  };

  //  useSaveDraft hook to save the activity draft

  useSaveDraft({
    title,
    notes,
    allowGPS,
    setAllowGPS,
    setTitle,
    setNotes,
    setActivityName,
  });

  const { startGPStracking } = useStartGPStracking();
  const { stopGPStracking } = useStopGPStracking();

  // useStartActivity hook to start the activity
  const { startActivity } = useStartActivity({ activityName, title });

  // useCountDistance hook to count the total distance
  const { meters } = useDistanceFromTrack({ track });

  // useCountAveragePace hook to count the average pace
  const movingTimeSeconds = useMovingTimeFromTrack(track);
  const averagePacePerKm = useAveragePace(meters, movingTimeSeconds ?? 0);

  // useSaveActivitySession hook to save the activity session
  const { handleSaveSession } = useSaveActivitySession({
    title,
    notes,
    meters,
    elapsedTime,
    setIsSaving,
    resetSession,
  });

  useEffect(() => {
    return () => {
      setSwipeEnabled(true);
    };
  }, [setSwipeEnabled]);


  // when point arrives add it to the track and persist it to the database
  const { addPoint, replaceFromFydration } = usePersistToDatabase();

  // when foreground resumes from background, hydrate the track from the database
  useTrackHydration({
    isRunning,
    setTrack,
    onHydrated: replaceFromFydration,
  });

  // When foreground watch gps
  useForegroundLocationTracker({
    allowGPS,
    isRunning,
    setHasStartedTracking,
    hasStartedTracking,
    onPoint: (point) => {
      setTrack((prev) => [...prev, point]);
      addPoint(point);
    },
  });

  return (
    <>
      {elapsedTime === 0 ? (
        <PageContainer>
          <AppText className="text-2xl text-center mb-5">
            Select Activity
          </AppText>
          <ActivityDropdown
            onSelect={async (activity) => {
              setActivityName(activity.name);
              setTitle(`${activity.name} - ${now}`);

              await AsyncStorage.mergeItem(
                "activity_draft",
                JSON.stringify({
                  activityId: activity.id,
                  activityName: activity.name,
                })
              );
            }}
          />
          <View className="flex-row items-center my-10 justify-between px-4">
            {allowGPS ? (
              <AppText className="text-lg">Disable Location Tracking</AppText>
            ) : (
              <Link href="/menu/settings">
                <AppText className="text-lg">Enable Location Tracking</AppText>
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
          <AnimatedButton
            label="Start Activity"
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
              onStart={startGPStracking}
              onPause={stopGPStracking}
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
                      label="session name"
                      value={title}
                      setValue={setTitle}
                      placeholder="Enter session name"
                    />
                    <SubNotesInput
                      label="session notes"
                      value={notes}
                      setValue={setNotes}
                      placeholder="Enter session notes"
                      className="min-h-[60px]"
                    />
                  </View>
                </View>

                {allowGPS && (
                  <BaseMap
                    track={track}
                    setScrollEnabled={setScrollEnabled}
                    setSwipeEnabled={setSwipeEnabled}    
                    title={title}
                    startGPStracking={startGPStracking}
                    stopGPStracking={stopGPStracking}
                    totalDistance={meters}
                    hasStartedTracking={hasStartedTracking}
                    averagePacePerKm={averagePacePerKm}
                  />
                )}
                <View className="gap-5 mt-10">
                  <SaveButton
                    label="Finish Activity"
                    onPress={handleSaveSession}
                  />
                  <DeleteButton label="Delete" onPress={resetSession} />
                  <Button
                    title="DEBUG: Log DB"
                    onPress={async () => {
                      const db = await getDatabase();
                      const points = await db.getAllAsync(
                        "SELECT * FROM gps_points"
                      );
                      const stats = await db.getAllAsync(
                        "SELECT * FROM session_stats"
                      );

                      console.log("GPS:", points);
                      console.log("STATS:", stats);
                    }}
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
          setFullScreen={setFullScreen}
          startGPStracking={startGPStracking}
          stopGPStracking={stopGPStracking}
          totalDistance={meters}
          hasStartedTracking={hasStartedTracking}
          averagePacePerKm={averagePacePerKm}
        />
      )}

      <InfoModal showModal={showModal} />

      <FullScreenLoader visible={isSaving} message="Saving session..." />
    </>
  );
}
