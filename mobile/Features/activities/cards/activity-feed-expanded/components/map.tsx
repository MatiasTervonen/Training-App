import { FullActivitySession } from "@/types/models";
import Mapbox from "@rnmapbox/maps";
import { Image, View } from "react-native";
import { useMemo, useState } from "react";
import {
  processSavedRoute,
  smoothMultiLineString,
} from "@/features/activities/lib/smoothCoordinates";
import {
  Move,
  Lock,
  Fullscreen,
  X,
  Layers2,
  Route,
} from "lucide-react-native";
import AnimatedButton from "@/components/buttons/animatedButton";

type MapProps = {
  activity_session: FullActivitySession;
  setScrollEnabled: (value: boolean) => void;
  setSwipeEnabled: (value: boolean) => void;
  setFullScreen: (value: boolean) => void;
};

export default function Map({
  activity_session,
  setScrollEnabled,
  setSwipeEnabled,
  setFullScreen,
}: MapProps) {
  const [expanded, setExpanded] = useState(false);
  const [mapActive, setMapActive] = useState(false);
  const [mapStyle, setMapStyle] = useState(Mapbox.StyleURL.Dark);
  const LINE_COLORS = [
    { glow: "rgba(59,130,246,0.4)", core: "#3b82f6" },   // blue
    { glow: "rgba(239,68,68,0.4)", core: "#ef4444" },     // red
    { glow: "rgba(34,197,94,0.4)", core: "#22c55e" },     // green
    { glow: "rgba(168,85,247,0.4)", core: "#a855f7" },    // purple
    { glow: "rgba(234,179,8,0.4)", core: "#eab308" },     // yellow
  ];
  const [colorIndex, setColorIndex] = useState(0);
  const lineColor = LINE_COLORS[colorIndex];

  const toggleLineColor = () => {
    setColorIndex((prev) => (prev + 1) % LINE_COLORS.length);
  };

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

  const toggleMapActive = () => {
    const next = !mapActive;
    setMapActive(next);
    setScrollEnabled(!next);
    setSwipeEnabled(!next);
  };

  return (
    <View style={{ height: 300 }}>
      <View pointerEvents={mapActive ? "auto" : "none"} style={{ flex: 1 }}>
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
      </View>
      {expanded ? (
        <View className="absolute z-50 bottom-0 left-0 right-0 flex-row items-center justify-between px-4 py-3 bg-slate-900">
          <AnimatedButton
            onPress={toggleMapActive}
            className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
            hitSlop={10}
          >
            {mapActive ? (
              <Lock size={22} color="#f3f4f6" />
            ) : (
              <Move size={22} color="#f3f4f6" />
            )}
          </AnimatedButton>
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
            onPress={() => {
              setExpanded(false);
              setFullScreen(true);
            }}
            className="p-2 rounded-full bg-blue-700 border-2 border-blue-500"
            hitSlop={10}
          >
            <Fullscreen size={22} color="#f3f4f6" />
          </AnimatedButton>
          <AnimatedButton
            onPress={() => setExpanded(false)}
            className="p-2 rounded-full bg-slate-700 border-2 border-slate-500"
            hitSlop={10}
          >
            <X size={22} color="#f3f4f6" />
          </AnimatedButton>
        </View>
      ) : (
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
  );
}
