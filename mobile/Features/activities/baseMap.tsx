import { View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import AnimatedButton from "../../components/buttons/animatedButton";
import { Layers2, MapPin } from "lucide-react-native";
import { TrackPoint } from "@/types/session";
import { useState } from "react";
import MapIcons from "./mapIcons";

type BaseMapProps = {
  track: TrackPoint[];
  setScrollEnabled: (value: boolean) => void;
  setSwipeEnabled: (value: boolean) => void;
  startGPStracking: () => void;
  stopGPStracking: () => void;
  totalDistance: number;
  title: string;
  averagePacePerKm: number;
  hasStartedTracking: boolean;
};

export default function BaseMap({
  track,
  setScrollEnabled,
  setSwipeEnabled,
  startGPStracking,
  stopGPStracking,
  totalDistance,
  title,
  hasStartedTracking,
  averagePacePerKm,
}: BaseMapProps) {
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [mapStyle, setMapStyle] = useState(Mapbox.StyleURL.Dark);

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

  const lastPoint = track[track.length - 1];

  const userFeature = lastPoint
    ? {
        type: "Feature",
        properties: {
          accuracy: lastPoint.accuracy,
        },
        geometry: {
          type: "Point",
          coordinates: [lastPoint.longitude, lastPoint.latitude],
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
                aboveLayerID="track-layer"
                style={{
                  lineColor: "#3b82f6",
                  lineWidth: 4,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </Mapbox.ShapeSource>
          )}
        </Mapbox.MapView>

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
        lastPoint={lastPoint}
        startGPStracking={startGPStracking}
        stopGPStracking={stopGPStracking}
        totalDistance={totalDistance}
        hasStartedTracking={hasStartedTracking}
        averagePacePerKm={averagePacePerKm}
      />
    </>
  );
}
