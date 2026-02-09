import { Modal, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import AnimatedButton from "@/components/buttons/animatedButton";
import { CircleX } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo } from "react";
import {
  processSavedRoute,
  smoothMultiLineString,
} from "@/features/activities/lib/smoothCoordinates";
import { FullActivitySession } from "@/types/models";
import SessionStats from "./sessionStats";

type MapProps = {
  activity_session: FullActivitySession;
  fullScreen: boolean;
  setFullScreen: (value: boolean) => void;
};

export default function FullScreenMapModal({
  activity_session,
  fullScreen,
  setFullScreen,
}: MapProps) {
  const insets = useSafeAreaInsets();
  const route = activity_session.route!;
  const isMultiLine = route.type === "MultiLineString";

  // Get all coordinates flattened for bounds calculation
  const allCoordinates = useMemo(() => {
    if (isMultiLine) {
      return (route.coordinates as [number, number][][]).flat();
    }
    return route.coordinates as [number, number][];
  }, [route, isMultiLine]);

  // Process segments: MultiLineString already has segments, LineString needs gap detection
  const routeSegments = useMemo(() => {
    if (isMultiLine) {
      return smoothMultiLineString(route.coordinates as [number, number][][]);
    }
    return processSavedRoute(route.coordinates as [number, number][]);
  }, [route, isMultiLine]);

  const routeFeature = {
    type: "Feature",
    geometry: {
      type: "MultiLineString",
      coordinates: routeSegments,
    },
    properties: {},
  };

  const start = allCoordinates[0]!;
  const end = allCoordinates[allCoordinates.length - 1];

  const lons = allCoordinates.map((c) => c[0]);
  const lats = allCoordinates.map((c) => c[1]);

  const ne: [number, number] = [Math.max(...lons), Math.max(...lats)];

  const sw: [number, number] = [Math.min(...lons), Math.min(...lats)];

  const startEndGeoJSON = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { type: "start" },
        geometry: {
          type: "Point",
          coordinates: start,
        },
      },
      {
        type: "Feature",
        properties: { type: "end" },
        geometry: {
          type: "Point",
          coordinates: end,
        },
      },
    ],
  };
  

  return (
    <Modal visible={fullScreen} transparent={true} animationType="slide">
      <View className="bg-slate-950 w-full h-full">
        <View className="flex-1">
          <Mapbox.MapView
            style={{ flex: 1 }}
            styleURL={Mapbox.StyleURL.Dark}
            scaleBarEnabled={false}
            logoEnabled={false}
            attributionEnabled={false}
          >
            <Mapbox.Images
              images={{
                start: require("@/assets/images/start-image.png"),
                end: require("@/assets/images/finnish-image.png"),
              }}
            />
            <Mapbox.Camera
              bounds={{
                ne,
                sw,
                paddingTop: 50,
                paddingBottom: 50,
                paddingLeft: 50,
                paddingRight: 50,
              }}
              animationMode="flyTo"
              animationDuration={2000}
            />
            <Mapbox.ShapeSource id="track-source" shape={routeFeature as any}>
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

            <Mapbox.ShapeSource id="points" shape={startEndGeoJSON as any}>
              <Mapbox.SymbolLayer
                id="points-layer"
                style={{
                  iconImage: [
                    "case",
                    ["==", ["get", "type"], "start"],
                    "start",
                    "end",
                  ],
                  iconSize: 0.12,
                  iconAnchor: "bottom",
                  iconAllowOverlap: true,
                  iconIgnorePlacement: true,
                }}
              />
            </Mapbox.ShapeSource>
          </Mapbox.MapView>
        </View>

        <View
          className="absolute z-50 top-5 right-10"
          style={{ top: insets.top }}
        >
          <AnimatedButton onPress={() => setFullScreen(false)} hitSlop={10}>
            <CircleX size={35} color="#3b82f6" />
          </AnimatedButton>
        </View>
        <View style={{ paddingBottom: insets.bottom }}>
          <SessionStats activity_session={activity_session} />
        </View>
      </View>
    </Modal>
  );
}
