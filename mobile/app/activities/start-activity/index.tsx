import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import ActivityDropdown from "@/components/activities/activityDropdown";
import { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import SubNotesInput from "@/components/SubNotesInput";
import Timer from "@/components/timer";
import Toggle from "@/components/toggle";

import MapboxGL from "@rnmapbox/maps";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Link } from "expo-router";
import { useTimerStore } from "@/lib/stores/timerStore";
import AnimatedButton from "@/components/buttons/animatedButton";
import useSaveDraft from "@/hooks/activity/useSaveDraft";
import FullScreenLoader from "@/components/FullScreenLoader";
import SaveButton from "@/components/buttons/SaveButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useSaveActivitySession from "@/hooks/activity/useSaveSession";
import DeleteButton from "@/components/buttons/DeleteButton";
import { Fullscreen } from "lucide-react-native";
import {
  useStartGPStracking,
  useStopGPStracking,
} from "@/components/activities/location-actions";
import { formatDate } from "@/lib/formatDate";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import MapIcons from "@/components/activities/mapIcons";
import FullScreenMapModal from "@/components/activities/fullScreenMapModal";
import BaseMap from "@/components/activities/baseMap";
import { TrackPoint } from "@/types/session";
import InfoModal from "@/components/activities/infoModal";
import { useCountDistance } from "@/hooks/activity/useCountDistance";
import { useStartActivity } from "@/hooks/activity/useStartActivity";
import { useForegroundLocationTracker } from "@/hooks/activity/useForegroundLocationTracker";

export default function StartActivityScreen() {
  const now = formatDate(new Date());
  const [activityName, setActivityName] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [allowGPS, setAllowGPS] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [track, setTrack] = useState<TrackPoint[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [mapStyle, setMapStyle] = useState(MapboxGL.StyleURL.Dark);
  const [coldStartCount, setColdStartCount] = useState(false);
  const [meters, setMeters] = useState(0);

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
    setMeters(0);
    // stop the GPS tracking
    await stopGPStracking();
  };

  //  useSaveDraft hook to save the activity draft
  useSaveDraft({
    title,
    notes,
    allowGPS,
    isLoaded,
    setAllowGPS,
    setIsLoaded,
    setTitle,
    setNotes,
    setActivityName,
    setMeters,
    meters,
  });

  const { startGPStracking } = useStartGPStracking();
  const { stopGPStracking } = useStopGPStracking();

  // useStartActivity hook to start the activity
  const { startActivity } = useStartActivity({ activityName, title });

  // useSaveActivitySession hook to save the activity session
  const { handleSaveSession } = useSaveActivitySession({
    title,
    notes,
    elapsedTime,
    track,
    setIsSaving,
    resetSession,
  });

  const lastPoint = track[track.length - 1];

  // useCountDistance hook to count the total distance
  const { totalDistanceKm } = useCountDistance({ track, meters, setMeters });

  useEffect(() => {
    return () => {
      setSwipeEnabled(true);
    };
  }, [setSwipeEnabled]);

  const MAP_STYLES = [
    MapboxGL.StyleURL.Dark,
    MapboxGL.StyleURL.SatelliteStreet,
    MapboxGL.StyleURL.Street,
  ];

  const toggleMapStyle = () => {
    setMapStyle((prev) => {
      const currentIndex = MAP_STYLES.indexOf(prev);
      const nextIndex =
        currentIndex === -1 ? 0 : (currentIndex + 1) % MAP_STYLES.length;

      return MAP_STYLES[nextIndex];
    });
  };

  // useForegroundLocationTracker hook to track the location when the app is in the foreground
  useForegroundLocationTracker({
    setTrack,
    allowGPS,
    isRunning,
    setColdStartCount,
  });

  if (!isLoaded) return null;

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
                    mapStyle={mapStyle}
                    track={track}
                    setScrollEnabled={setScrollEnabled}
                    setSwipeEnabled={setSwipeEnabled}
                    toggleMapStyle={toggleMapStyle}
                  />
                )}
                {allowGPS && (
                  <MapIcons
                    title={title}
                    lastPoint={lastPoint}
                    startGPStracking={startGPStracking}
                    stopGPStracking={stopGPStracking}
                    totalDistance={totalDistanceKm}
                    isColdStart={coldStartCount}
                  />
                )}
                <View className="gap-5 mt-10">
                  <SaveButton
                    label="Finish Activity"
                    onPress={handleSaveSession}
                  />
                  <DeleteButton label="Delete" onPress={resetSession} />
                </View>
              </View>
            </PageContainer>
          </ScrollView>
        </>
      )}

      {allowGPS && (
        <FullScreenMapModal
          fullScreen={fullScreen}
          mapStyle={mapStyle}
          track={track}
          lastPoint={lastPoint}
          setFullScreen={setFullScreen}
          toggleMapStyle={toggleMapStyle}
          startGPStracking={startGPStracking}
          stopGPStracking={stopGPStracking}
          totalDistance={totalDistanceKm}
          isColdStart={coldStartCount}
        />
      )}

      <InfoModal showModal={showModal} />

      <FullScreenLoader visible={isSaving} message="Saving session..." />
    </>
  );
}
