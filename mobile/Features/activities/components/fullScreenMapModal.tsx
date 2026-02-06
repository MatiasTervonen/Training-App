import { Modal, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import AnimatedButton from "../../../components/buttons/animatedButton";
import { CircleX, Layers2, MapPin } from "lucide-react-native";
import MapIcons from "./mapIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackPoint } from "@/types/session";
import { useEffect, useMemo, useRef, useState } from "react";
import useForeground from "../hooks/useForeground";
import { findWarmupStartIndex } from "../lib/findWarmupStartIndex";
import { processLiveTrack } from "../lib/smoothCoordinates";

export default function FullScreenMapModal({
  fullScreen,
  track,
  templateRoute,
  setFullScreen,
  startGPStracking,
  stopGPStracking,
  totalDistance,
  hasStartedTracking,
  averagePacePerKm,
  currentStepCount,
  currentPosition,
}: {
  fullScreen: boolean;
  track: TrackPoint[];
  templateRoute: [number, number][] | null;
  setFullScreen: (value: boolean) => void;
  startGPStracking: () => void;
  stopGPStracking: () => void;
  totalDistance: number;
  hasStartedTracking: boolean;
  averagePacePerKm: number;
  currentStepCount: number;
  currentPosition?: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null;
}) {
  const insets = useSafeAreaInsets();
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
    <Modal visible={fullScreen} transparent={true} animationType="slide">
      <View className="bg-slate-950 w-full h-full">
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
          </Mapbox.MapView>
          <View className="absolute z-50" style={{ bottom: 50, right: 25 }}>
            <AnimatedButton
              onPress={toggleMapStyle}
              className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
              hitSlop={10}
            >
              <Layers2 size={25} color="#f3f4f6" />
            </AnimatedButton>
          </View>
          <View className="absolute z-50" style={{ bottom: 50, right: 80 }}>
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
          title="Activity"
          lastMovingPoint={lastMovingPoint as TrackPoint}
          style={{ bottom: insets.bottom }}
          startGPStracking={startGPStracking}
          stopGPStracking={stopGPStracking}
          totalDistance={totalDistance}
          hasStartedTracking={hasStartedTracking}
          averagePacePerKm={averagePacePerKm}
          currentStepCount={currentStepCount}
        />
        <View
          className="absolute z-50 top-5 right-10"
          style={{ top: insets.top }}
        >
          <AnimatedButton onPress={() => setFullScreen(false)} hitSlop={10}>
            <CircleX size={35} color="#3b82f6" />
          </AnimatedButton>
        </View>
      </View>
    </Modal>
  );
}
