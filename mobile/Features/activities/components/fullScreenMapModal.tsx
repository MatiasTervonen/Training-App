import { Modal, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import AnimatedButton from "../../../components/buttons/animatedButton";
import { CircleX, Layers2, MapPin } from "lucide-react-native";
import MapIcons from "./mapIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackPoint } from "@/types/session";
import { useEffect, useState } from "react";
import useForeground from "../hooks/useForeground";

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
}) {
  const insets = useSafeAreaInsets();
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [mapStyle, setMapStyle] = useState(Mapbox.StyleURL.Dark);
  const { isForeground } = useForeground();

  useEffect(() => {
    if (isForeground) {
      setIsFollowingUser(true);
    }
  }, [isForeground]);

  const shouldShowTemplateRoute = templateRoute && templateRoute.length > 0;

  const mapCoordinates = track
    .filter((p) => !p.isStationary && (p.accuracy == null || p.accuracy <= 30))
    .map((p) => [p.longitude, p.latitude]);

  const trackShape = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: mapCoordinates,
    },
  };

  const lastMovingPoint = [...track]
    .reverse()
    .find((p) => !p.isStationary);

  const userFeature = lastMovingPoint
    ? {
      type: "Feature",
      properties: {
        accuracy: lastMovingPoint.accuracy,
      },
      geometry: {
        type: "Point",
        coordinates: [lastMovingPoint.longitude, lastMovingPoint.latitude],
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

            {track.length > 0 && (
              <Mapbox.ShapeSource id="track-source" shape={trackShape as any}>
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
            )}

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
          lastPoint={lastMovingPoint as TrackPoint}
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
