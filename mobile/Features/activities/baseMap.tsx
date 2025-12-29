import { View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import AnimatedButton from "../../components/buttons/animatedButton";
import { Layers2, MapPin } from "lucide-react-native";
import { TrackPoint } from "@/types/session";
import { useEffect, useState } from "react";
import useForeground from "@/Features/activities/hooks/useForegound";

type BaseMapProps = {
  mapStyle: Mapbox.StyleURL;
  track: TrackPoint[];
  setScrollEnabled: (value: boolean) => void;
  setSwipeEnabled: (value: boolean) => void;
  toggleMapStyle: () => void;
};

export default function BaseMap({
  mapStyle,
  track,
  setScrollEnabled,
  setSwipeEnabled,
  toggleMapStyle,
}: BaseMapProps) {
  const [isFollowingUser, setIsFollowingUser] = useState(true);

  const { isForeground } = useForeground();

  useEffect(() => {
    if (isForeground) {
      Mapbox.locationManager.start();
    } else {
      Mapbox.locationManager.stop();
    }

    return () => {
      Mapbox.locationManager.stop();
    };
  }, [isForeground]);

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

  return (
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
        <Mapbox.UserLocation visible={true} />

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
  );
}
