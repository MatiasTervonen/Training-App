import { View, Text, ActivityIndicator } from "react-native";
import Mapbox from "@rnmapbox/maps";
import AnimatedButton from "../../../components/buttons/animatedButton";
import { Layers2, MapPin } from "lucide-react-native";
import { TrackPoint } from "@/types/session";
import { useState, useEffect, useMemo, useRef } from "react";
import MapIcons from "./mapIcons";
import useForeground from "../hooks/useForeground";
import { findWarmupStartIndex } from "../lib/findWarmupStartIndex";
import { processLiveTrack } from "../lib/smoothCoordinates";
import Toast from "react-native-toast-message";

type BaseMapProps = {
  track: TrackPoint[];
  templateRoute: [number, number][] | null;
  setScrollEnabled: (value: boolean) => void;
  setSwipeEnabled: (value: boolean) => void;
  startGPStracking: () => void;
  stopGPStracking: () => void;
  totalDistance: number;
  title: string;
  averagePacePerKm: number;
  hasStartedTracking: boolean;
  currentStepCount: number;
  isLoadingTemplateRoute: boolean;
  isLoadingPosition: boolean;
  currentPosition?: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null;
};

export default function BaseMap({
  track,
  templateRoute,
  setScrollEnabled,
  setSwipeEnabled,
  startGPStracking,
  stopGPStracking,
  totalDistance,
  title,
  hasStartedTracking,
  averagePacePerKm,
  currentStepCount,
  isLoadingTemplateRoute,
  isLoadingPosition,
  currentPosition,
}: BaseMapProps) {
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [mapStyle, setMapStyle] = useState(Mapbox.StyleURL.Dark);
  const { isForeground } = useForeground();

  // Force ShapeSource remount on background→foreground to fix Mapbox native state desync
  const prevForegroundRef = useRef(isForeground);
  const [sourceKey, setSourceKey] = useState(0);

  useEffect(() => {
    const wasForeground = prevForegroundRef.current;
    prevForegroundRef.current = isForeground;

    if (isForeground) {
      setIsFollowingUser(true);
      if (!wasForeground) {
        setSourceKey((prev) => prev + 1);
      }
    }
  }, [isForeground]);


  const shouldShowTemplateRoute = templateRoute && templateRoute.length > 0;

  const warmupStartIndex = useMemo(() => findWarmupStartIndex(track), [track]);

  const trackSegments = useMemo(() => {
    if (warmupStartIndex === null) return [];

    // Pass full track including stationary points - processLiveTrack handles filtering
    // This ensures gap detection works correctly when user stops for a while
    return processLiveTrack(track.slice(warmupStartIndex));
  }, [track, warmupStartIndex]);

  // DEBUG: Track what BaseMap receives after foreground transition
  // Delay to avoid collision with hydration toast
  const prevTrackLengthRef = useRef(track.length);
  useEffect(() => {
    const prevLen = prevTrackLengthRef.current;
    const newLen = track.length;
    // Only toast if track length changed significantly (hydration)
    if (newLen > prevLen + 5 || (prevLen === 0 && newLen > 0)) {
      const totalCoords = trackSegments.reduce((sum, seg) => sum + seg.length, 0);
      const timer = setTimeout(() => {
        Toast.show({
          type: trackSegments.length > 0 ? "success" : "error",
          text1: `BaseMap: ${newLen}pts segs:${trackSegments.length} warmup:${warmupStartIndex}`,
          text2: `coords:${totalCoords}`,
          visibilityTime: 6000,
        });
      }, 1500); // Wait 1.5 seconds after hydration toast
      prevTrackLengthRef.current = newLen;
      return () => clearTimeout(timer);
    }
    prevTrackLengthRef.current = newLen;
  }, [track.length, trackSegments, warmupStartIndex]);

  // DEBUG: Alert when we have track data but can't draw (the bug!)
  // Delay to avoid collision with hydration toast
  useEffect(() => {
    if (track.length >= 10 && trackSegments.length === 0) {
      const stationary = track.filter(p => p.isStationary).length;
      const badSignal = track.filter(p => p.isBadSignal).length;
      const timer = setTimeout(() => {
        Toast.show({
          type: "error",
          text1: `BUG: ${track.length}pts but 0 segs! warmup:${warmupStartIndex}`,
          text2: `stat:${stationary} bad:${badSignal}`,
          visibilityTime: 10000,
        });
      }, 2000); // Wait 2 seconds after hydration toast
      return () => clearTimeout(timer);
    }
  }, [track, trackSegments, warmupStartIndex]);

  const trackShape = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "MultiLineString",
      coordinates: trackSegments,
    },
  };

  const lastPoint = track.length > 0 ? track[track.length - 1] : null;

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

  const lastMovingPoint =
    [...track].reverse().find((p) => !p.isStationary) ?? null;

  return (
    <>
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
        onTouchCancel={() => {
          setScrollEnabled(true);
          setSwipeEnabled(true);
        }}
      >
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
              aboveLayerID="track-layer"
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
        </Mapbox.MapView>

        {isLoadingTemplateRoute && (
          <View
            className="absolute z-50 flex-row gap-2 items-center px-2 py-1 rounded"
            style={{ top: 10, left: 10 }}
          >
            <Text className="text-white text-xs ml-1.5">Loading route...</Text>
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        )}

        {isLoadingPosition && (
          <View
            className="absolute z-50 flex-row gap-2 items-center px-2 py-1 rounded"
            style={{ top: isLoadingTemplateRoute ? 35 : 10, left: 10 }}
          >
            <Text className="text-white text-xs ml-1.5">
              {currentPosition ? "Stabilizing GPS..." : "Loading position..."}
            </Text>
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        )}

        <View className="absolute z-50" style={{ bottom: 15, right: 25 }}>
          <AnimatedButton
            onPress={toggleMapStyle}
            className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
            hitSlop={10}
          >
            <Layers2 size={25} color="#f3f4f6" />
          </AnimatedButton>
        </View>
        <View className="absolute z-50" style={{ bottom: 15, right: 80 }}>
          <AnimatedButton
            onPress={() => setIsFollowingUser(true)}
            className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
            hitSlop={10}
          >
            <MapPin size={25} color="#f3f4f6" />
          </AnimatedButton>
        </View>
      </View>
      <MapIcons
        title={title || "Activity"}
        lastMovingPoint={lastMovingPoint as TrackPoint}
        startGPStracking={startGPStracking}
        stopGPStracking={stopGPStracking}
        totalDistance={totalDistance}
        hasStartedTracking={hasStartedTracking}
        averagePacePerKm={averagePacePerKm}
        currentStepCount={currentStepCount}
      />
    </>
  );
}
