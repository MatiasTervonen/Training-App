import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import ActivityDropdown from "@/components/activities/activityDropdown";
import { useState, useEffect } from "react";
import { View, ScrollView, Modal, Pressable } from "react-native";
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
import LinkButton from "@/components/buttons/LinkButton";
import {
  Info,
  Compass,
  Mountain,
  Gauge,
  Fullscreen,
  CircleX,
  Layers2,
} from "lucide-react-native";
import {
  useStartGPStracking,
  useStopGPStracking,
} from "@/components/activities/location-actions";
import { formatDate } from "@/lib/formatDate";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TrackPoint = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
};

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
  const insets = useSafeAreaInsets();

  console.log("track", track);

  const gpsEnabledGlobally = useUserStore(
    (state) => state.settings?.gps_tracking_enabled
  );

  const setSwipeEnabled = useModalPageConfig((state) => state.setSwipeEnabled);

  const { startTimer, setActiveSession, elapsedTime, stopTimer, isRunning } =
    useTimerStore();

  const resetSession = () => {
    stopTimer();
    setActiveSession(null);
    AsyncStorage.removeItem("activity_draft");
    setTitle("");
    setNotes("");
    setActivityName("");
    setAllowGPS(false);
    setTrack([]);
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
  });

  const { startGPStracking } = useStartGPStracking();
  const { stopGPStracking } = useStopGPStracking();

  const startActivity = async () => {
    if (elapsedTime > 0) return;

    setActiveSession({
      type: "activity",
      label: title,
      path: "/activities/start-activity",
    });

    const startTime = new Date().toISOString();

    await AsyncStorage.mergeItem(
      "activity_draft",
      JSON.stringify({ startTime, track: [] })
    );

    await startGPStracking();

    startTimer(0);
  };

  // useSaveActivitySession hook to save the activity session
  const { handleSaveSession } = useSaveActivitySession({
    title,
    notes,
    elapsedTime,
    track,
    setIsSaving,
    resetSession,
  });

  const mapCoordinates = track
    .filter((p) => p.accuracy == null || p.accuracy <= 30)
    .map((p) => [p.longitude, p.latitude]);

  const trackShape = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: mapCoordinates,
    },
  };

  console.log("mapCoordinates", mapCoordinates);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      const stored = await AsyncStorage.getItem("activity_draft");
      if (!stored) return;

      console.log("stored", stored);
      const parsed = JSON.parse(stored);

      console.log("track yes i have it", track);
      setTrack(Array.isArray(parsed.track) ? parsed.track : []);
    }, 3000);

    return () => clearInterval(interval);
  }, [isRunning, track]);

  const lastPoint = track[track.length - 1];

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
              <AppText className="text-lg">Disable GPS Tracking</AppText>
            ) : (
              <Link href="/menu/settings">
                <AppText className="text-lg">Enable GPS Tracking</AppText>
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
                  <View
                    style={{ height: 300 }}
                    className="mt-10"
                    onTouchStart={() => {
                      setScrollEnabled(false);
                      setSwipeEnabled(false);
                    }}
                    onTouchEnd={() => {
                      setScrollEnabled(true);
                      setSwipeEnabled(true);
                    }}
                  >
                    <MapboxGL.MapView
                      style={{ flex: 1 }}
                      styleURL={mapStyle}
                      scaleBarEnabled={false}
                      logoEnabled={false}
                      attributionEnabled={false}
                    >
                      <MapboxGL.UserLocation visible={true} />
                      <MapboxGL.Camera
                        followUserLocation={true}
                        followZoomLevel={15}
                        animationMode="flyTo"
                        animationDuration={1000}
                      />

                      {track.length > 0 && (
                        <MapboxGL.ShapeSource
                          id="track-source"
                          shape={trackShape as any}
                        >
                          <MapboxGL.LineLayer
                            id="track-layer"
                            style={{
                              lineColor: "#3b82f6",
                              lineCap: "round",
                              lineJoin: "round",
                              lineWidth: 3,
                            }}
                          />
                        </MapboxGL.ShapeSource>
                      )}
                    </MapboxGL.MapView>
                    <View
                      className="absolute z-50"
                      style={{ bottom: 15, right: 25 }}
                    >
                      <AnimatedButton
                        onPress={toggleMapStyle}
                        className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
                        hitSlop={10}
                      >
                        <Layers2 size={25} color="#f3f4f6" />
                      </AnimatedButton>
                    </View>
                  </View>
                )}
                {allowGPS && (
                  <View className="bg-slate-950 py-5 rounded-b-2xl mb-10">
                    <View className="gap-10 flex-row items-center justify-around">
                      <View>
                        {lastPoint?.speed != null ? (
                          <View className="items-center justify-center">
                            <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                              <AppText className="text-2xl">
                                {(lastPoint?.speed * 3.6).toFixed(1)}
                              </AppText>
                            </View>
                            <Gauge size={20} color="#f3f4f6" />
                          </View>
                        ) : (
                          <View className="items-center justify-center">
                            <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                              <AppText className="text-2xl">-</AppText>
                            </View>
                            <Gauge size={20} color="#f3f4f6" />
                          </View>
                        )}
                      </View>

                      <View>
                        {lastPoint?.heading != null ? (
                          <View className="items-center justify-center">
                            <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                              <AppText className="text-2xl">
                                {Math.round(lastPoint.heading)}
                              </AppText>
                            </View>
                            <Compass
                              size={20}
                              color="#f3f4f6"
                              className={`transform rotate-[${lastPoint.heading}deg]`}
                            />
                          </View>
                        ) : (
                          <View className="items-center justify-center">
                            <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                              <AppText className="text-2xl">-</AppText>
                            </View>
                            <Compass size={20} color="#f3f4f6" />
                          </View>
                        )}
                      </View>

                      <View>
                        {lastPoint?.altitude != null ? (
                          <View className="items-center justify-center">
                            <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                              <AppText className="text-2xl">
                                {lastPoint.altitude.toFixed(1)}
                              </AppText>
                            </View>
                            <Mountain size={20} color="#3b82f6" />
                          </View>
                        ) : (
                          <View className="items-center justify-center">
                            <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                              <AppText className="text-2xl">-</AppText>
                            </View>
                            <Mountain size={20} color="#f3f4f6" />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                )}
                <View className="gap-5">
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
        <Modal visible={fullScreen} transparent={true} animationType="slide">
          <View className="bg-slate-950 w-full h-full">
            <View className="flex-1">
              <MapboxGL.MapView
                style={{ flex: 1 }}
                styleURL={mapStyle}
                scaleBarEnabled={false}
                logoEnabled={false}
                attributionEnabled={false}
              >
                <MapboxGL.UserLocation visible={true} />
                <MapboxGL.Camera
                  followUserLocation={true}
                  followZoomLevel={15}
                  animationMode="flyTo"
                  animationDuration={1000}
                />

                {track.length > 0 && (
                  <MapboxGL.ShapeSource
                    id="track-source"
                    shape={trackShape as any}
                  >
                    <MapboxGL.LineLayer
                      id="track-layer"
                      style={{
                        lineColor: "#3b82f6",
                        lineCap: "round",
                        lineJoin: "round",
                        lineWidth: 3,
                      }}
                    />
                  </MapboxGL.ShapeSource>
                )}
              </MapboxGL.MapView>
              <View className="absolute z-50" style={{ bottom: 50, right: 25 }}>
                <AnimatedButton
                  onPress={toggleMapStyle}
                  className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
                  hitSlop={10}
                >
                  <Layers2 size={25} color="#f3f4f6" />
                </AnimatedButton>
              </View>
            </View>
            <View
              className="bg-slate-950 py-5 "
              style={{ bottom: insets.bottom }}
            >
              {allowGPS && (
                <View className="gap-10 flex-row items-center justify-around">
                  <View>
                    {lastPoint?.speed != null ? (
                      <View className="items-center justify-center">
                        <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                          <AppText className="text-2xl">
                            {(lastPoint?.speed * 3.6).toFixed(1)}
                          </AppText>
                        </View>
                        <Gauge size={20} color="#f3f4f6" />
                      </View>
                    ) : (
                      <View className="items-center justify-center">
                        <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                          <AppText className="text-2xl">-</AppText>
                        </View>
                        <Gauge size={20} color="#f3f4f6" />
                      </View>
                    )}
                  </View>

                  <View>
                    {lastPoint?.heading != null ? (
                      <View className="items-center justify-center">
                        <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                          <AppText className="text-2xl">
                            {Math.round(lastPoint.heading)}
                          </AppText>
                        </View>
                        <Compass
                          size={20}
                          color="#f3f4f6"
                          className={`transform rotate-[${lastPoint.heading}deg]`}
                        />
                      </View>
                    ) : (
                      <View className="items-center justify-center">
                        <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                          <AppText className="text-2xl">-</AppText>
                        </View>
                        <Compass size={20} color="#f3f4f6" />
                      </View>
                    )}
                  </View>

                  <View>
                    {lastPoint?.altitude != null ? (
                      <View className="items-center justify-center">
                        <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                          <AppText className="text-2xl">
                            {lastPoint.altitude.toFixed(1)}
                          </AppText>
                        </View>
                        <Mountain size={20} color="#3b82f6" />
                      </View>
                    ) : (
                      <View className="items-center justify-center">
                        <View className="border-2 border-blue-500 rounded-full w-14 h-14 items-center justify-center mb-2">
                          <AppText className="text-2xl">-</AppText>
                        </View>
                        <Mountain size={20} color="#f3f4f6" />
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => setFullScreen(false)}
              className="absolute z-[999]"
              hitSlop={10}
              style={{ top: insets.top + 12, right: 30 }}
            >
              <CircleX size={35} color="#3b82f6" />
            </Pressable>
          </View>
        </Modal>
      )}

      <Modal visible={showModal} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 px-5">
          <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
            <View className="mb-5">
              <Info size={35} color="#fbbf24" />
            </View>
            <AppText className="text-xl mb-6 text-center">
              GPS tracking disabled.
            </AppText>
            <AppText className="text-lg mb-6 text-center">
              Enable GPS tracking from settings to track your activity.
            </AppText>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <LinkButton href="/sessions" label="Back" />
              </View>
              <View className="flex-1">
                <LinkButton href="/menu/settings" label="Settings" />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <FullScreenLoader visible={isSaving} message="Saving session..." />
    </>
  );
}
