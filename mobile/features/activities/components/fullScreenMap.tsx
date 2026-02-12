import { ActivityIndicator, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import AnimatedButton from "../../../components/buttons/animatedButton";
import { CircleX, Layers2, MapPin, NotebookPen } from "lucide-react-native";
import SessionStats from "./sessionStats";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackPoint } from "@/types/session";
import { useEffect, useMemo, useRef, useState } from "react";
import { findWarmupStartIndex } from "../lib/findWarmupStartIndex";
import { processLiveTrack } from "../lib/smoothCoordinates";
import AppText from "@/components/AppText";
import { useRouter } from "expo-router";
import { debugLog } from "../lib/debugLogger";

type FullScreenMapProps = {
  track: TrackPoint[];
  templateRoute: [number, number][] | null;
  startGPStracking: () => void;
  stopGPStracking: () => void;
  totalDistance: number;
  title: string;
  averagePacePerKm: number;
  hasStartedTracking: boolean;
  currentStepCount: number;
  isLoadingTemplateRoute: boolean;
  isLoadingPosition: boolean;
  isHydrated: boolean;
  liveCalories?: number;
  onNotesPress?: () => void;
  currentPosition?: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null;
};

export default function FullScreenMap({
  track,
  templateRoute,
  startGPStracking,
  stopGPStracking,
  totalDistance,
  title,
  hasStartedTracking,
  averagePacePerKm,
  currentStepCount,
  currentPosition,
  isLoadingTemplateRoute,
  isLoadingPosition,
  isHydrated,
  liveCalories,
  onNotesPress,
}: FullScreenMapProps) {
  const insets = useSafeAreaInsets();
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [mapStyle, setMapStyle] = useState(Mapbox.StyleURL.Dark);

  const router = useRouter();

  // Force ShapeSource remount after hydration completes
  // Mapbox ShapeSource doesn't always pick up shape prop changes
  const [sourceKey, setSourceKey] = useState(0);
  const prevHydratedRef = useRef(isHydrated);

  useEffect(() => {
    const wasHydrated = prevHydratedRef.current;
    prevHydratedRef.current = isHydrated;

    // isHydrated goes false→true after returning from background
    if (isHydrated && !wasHydrated) {
      setIsFollowingUser(true);
      setSourceKey((prev) => {
        debugLog("MAP", `Hydration complete, remounting ShapeSource (key=${prev + 1})`);
        return prev + 1;
      });
    }
  }, [isHydrated]);

  const shouldShowTemplateRoute = templateRoute && templateRoute.length > 0;

  const warmupStartIndex = useMemo(() => findWarmupStartIndex(track), [track]);

  const trackSegments = useMemo(() => {
    if (warmupStartIndex === null) {
      debugLog("MAP", `trackSegments: warmupStartIndex=null, track=${track.length} pts → 0 segments`);
      return [];
    }

    // Pass full track including stationary points - processLiveTrack handles filtering
    // This ensures gap detection works correctly when user stops for a while
    const segments = processLiveTrack(track.slice(warmupStartIndex));
    const totalPts = segments.reduce((sum, s) => sum + s.length, 0);
    debugLog("MAP", `trackSegments: ${segments.length} segment(s), ${totalPts} rendered pts (from ${track.length} track pts, warmup=${warmupStartIndex})`);
    return segments;
  }, [track, warmupStartIndex]);

  const trackShape = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "MultiLineString",
      coordinates: trackSegments,
    },
  };

  const lastPoint = track.length > 0 ? track[track.length - 1] : null;

  const lastMovingPoint =
    [...track].reverse().find((p) => !p.isStationary) ?? null;

  // Use currentPosition for user dot if available (updates during warmup),
  // otherwise fall back to last track point
  const userPosition = currentPosition ?? lastPoint;

  const userFeature = userPosition
    ? {
        type: "Feature",
        properties: {
          accuracy: userPosition.accuracy,
        },
        geometry: {
          type: "Point",
          coordinates: [userPosition.longitude, userPosition.latitude],
        },
      }
    : null;

  const MAP_STYLES = [
    Mapbox.StyleURL.Dark,
    Mapbox.StyleURL.SatelliteStreet,
    Mapbox.StyleURL.Street,
  ];

  const toggleMapStyle = () => {
    setMapStyle((prev) => {
      const currentIndex = MAP_STYLES.indexOf(prev);
      const nextIndex =
        currentIndex === -1 ? 0 : (currentIndex + 1) % MAP_STYLES.length;

      return MAP_STYLES[nextIndex];
    });
  };

  return (
    <>
      <View className="flex-1">
        <Mapbox.MapView
          style={{ flex: 1 }}
          styleURL={mapStyle}
          scaleBarEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
          onTouchStart={() => {
            setIsFollowingUser(false);
          }}
        >
          {userFeature && (
            <Mapbox.ShapeSource id="user-location" shape={userFeature as any}>
              <Mapbox.CircleLayer
                id="user-dot-outer-blur"
                style={{
                  circleColor: "#3b82f6",
                  circleRadius: 18,
                  circleOpacity: 0.25,
                }}
              />
              <Mapbox.CircleLayer
                id="user-dot-core"
                style={{
                  circleColor: "#3b82f6",
                  circleRadius: 9,
                  circleOpacity: 1,
                  circleStrokeColor: "#ffffff",
                  circleStrokeWidth: 2,
                }}
              />
            </Mapbox.ShapeSource>
          )}

          <Mapbox.Camera
            followUserLocation={isFollowingUser}
            followZoomLevel={15}
            animationMode={isFollowingUser ? "linearTo" : "easeTo"}
            animationDuration={isFollowingUser ? 0 : 600}
          />

          <Mapbox.ShapeSource
            key={`track-${sourceKey}`}
            id="track-source"
            shape={trackShape as any}
          >
            <Mapbox.LineLayer
              id="track-layer"
              style={{
                lineColor: "rgba(59,130,246,0.4)",
                lineCap: "round",
                lineJoin: "round",
                lineWidth: 10,
                lineBlur: 4,
              }}
            />
            <Mapbox.LineLayer
              id="track-core"
              style={{
                lineColor: "#3b82f6",
                lineWidth: 4,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </Mapbox.ShapeSource>

          {shouldShowTemplateRoute && (
            <Mapbox.ShapeSource
              id="template-route"
              shape={{
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: templateRoute,
                },
                properties: {},
              }}
            >
              <Mapbox.LineLayer
                id="template-route-layer"
                style={{
                  lineColor: "rgba(255,255,255,0.35)",
                  lineWidth: 4,
                  lineCap: "round",
                  lineJoin: "round",
                  lineDasharray: [2, 2],
                }}
              />
            </Mapbox.ShapeSource>
          )}

          {isLoadingTemplateRoute && (
            <View
              className="absolute z-50 flex-row gap-2 items-center px-2 py-1 rounded"
              style={{ top: 10, left: 10 }}
            >
              <AppText className="text-xs ml-1.5">Loading route...</AppText>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          )}

          {isLoadingPosition && (
            <View
              className="absolute z-50 flex-row gap-2 items-center px-2 py-1 rounded"
              style={{ top: isLoadingTemplateRoute ? 35 : 10, left: 10 }}
            >
              <AppText className="text-xs ml-1.5">
                {currentPosition ? "Stabilizing GPS..." : "Loading position..."}
              </AppText>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          )}
        </Mapbox.MapView>
        <View className="absolute z-50 gap-3" style={{ bottom: 15, right: 15 }}>
          <AnimatedButton
            onPress={() => setIsFollowingUser(true)}
            className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
            hitSlop={10}
          >
            <MapPin size={22} color="#f3f4f6" />
          </AnimatedButton>
          <AnimatedButton
            onPress={toggleMapStyle}
            className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
            hitSlop={10}
          >
            <Layers2 size={22} color="#f3f4f6" />
          </AnimatedButton>
          <AnimatedButton
            onPress={() => onNotesPress?.()}
            className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
            hitSlop={10}
          >
            <NotebookPen size={22} color="#f3f4f6" />
          </AnimatedButton>
        </View>
      </View>
      <SessionStats
        title={title || "Activity"}
        gpsEnabled
        lastMovingPoint={lastMovingPoint as TrackPoint}
        startGPStracking={startGPStracking}
        stopGPStracking={stopGPStracking}
        totalDistance={totalDistance}
        hasStartedTracking={hasStartedTracking}
        averagePacePerKm={averagePacePerKm}
        currentStepCount={currentStepCount}
        liveCalories={liveCalories}
      />
      <View
        className="absolute z-50 top-5 right-10"
        style={{ top: insets.top }}
      >
        <AnimatedButton onPress={() => router.back()} hitSlop={10}>
          <CircleX size={35} color="#3b82f6" />
        </AnimatedButton>
      </View>
    </>
  );
}
