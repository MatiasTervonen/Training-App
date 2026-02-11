import { Image, Modal, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import AnimatedButton from "@/components/buttons/animatedButton";
import { CircleX, Layers2, LocateFixed, Route, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useRef, useState } from "react";
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
  hasRoute: boolean;
};

export default function FullScreenMapModal({
  activity_session,
  fullScreen,
  setFullScreen,
  hasRoute,
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

  const LINE_COLORS = [
    { glow: "rgba(59,130,246,0.4)", core: "#3b82f6" },
    { glow: "rgba(239,68,68,0.4)", core: "#ef4444" },
    { glow: "rgba(34,197,94,0.4)", core: "#22c55e" },
    { glow: "rgba(168,85,247,0.4)", core: "#a855f7" },
    { glow: "rgba(234,179,8,0.4)", core: "#eab308" },
  ];

  const MAP_STYLES = [
    Mapbox.StyleURL.Dark,
    Mapbox.StyleURL.SatelliteStreet,
    Mapbox.StyleURL.Street,
  ];

  const [mapStyle, setMapStyle] = useState(Mapbox.StyleURL.Dark);
  const [colorIndex, setColorIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const lineColor = LINE_COLORS[colorIndex];

  const toggleMapStyle = () => {
    setMapStyle((prev) => {
      const currentIndex = MAP_STYLES.indexOf(prev);
      const nextIndex =
        currentIndex === -1 ? 0 : (currentIndex + 1) % MAP_STYLES.length;
      return MAP_STYLES[nextIndex];
    });
  };

  const toggleLineColor = () => {
    setColorIndex((prev) => (prev + 1) % LINE_COLORS.length);
  };

  const recenter = () => {
    cameraRef.current?.fitBounds(ne, sw, [50, 50, 50, 50], 1000);
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
          >
            <Mapbox.Images
              images={{
                start: require("@/assets/images/start-image.png"),
                end: require("@/assets/images/finnish-image.png"),
              }}
            />
            <Mapbox.Camera
              ref={cameraRef}
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
                  lineColor: lineColor.glow,
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
                  lineColor: lineColor.core,
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

          {!expanded && (
            <AnimatedButton
              onPress={() => setExpanded(true)}
              className="absolute z-50"
              style={{ bottom: 15, right: 25 }}
              hitSlop={10}
            >
              <Image
                source={require("@/assets/images/ios-tinted-icon.png")}
                style={{ width: 40, height: 40, borderRadius: 10 }}
              />
            </AnimatedButton>
          )}
        </View>

        <View className="absolute z-50 right-5" style={{ top: insets.top }}>
          <AnimatedButton onPress={() => setFullScreen(false)} hitSlop={10}>
            <CircleX size={35} color="#3b82f6" />
          </AnimatedButton>
        </View>

        {expanded ? (
          <View className="flex-row items-center justify-between px-4 py-3 bg-slate-900">
            <AnimatedButton
              onPress={toggleMapStyle}
              className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
              hitSlop={10}
            >
              <Layers2 size={22} color="#f3f4f6" />
            </AnimatedButton>
            <AnimatedButton
              onPress={toggleLineColor}
              className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
              hitSlop={10}
            >
              <Route size={22} color="#f3f4f6" />
            </AnimatedButton>
            <AnimatedButton
              onPress={recenter}
              className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
              hitSlop={10}
            >
              <LocateFixed size={22} color="#f3f4f6" />
            </AnimatedButton>
            <AnimatedButton
              onPress={() => setExpanded(false)}
              className="p-2 rounded-full bg-slate-700 border-2 border-slate-500"
              hitSlop={10}
            >
              <X size={22} color="#f3f4f6" />
            </AnimatedButton>
          </View>
        ) : null}
        <View style={{ paddingBottom: insets.bottom }}>
          <SessionStats
            activity_session={activity_session}
            hasRoute={hasRoute}
          />
        </View>
      </View>
    </Modal>
  );
}
