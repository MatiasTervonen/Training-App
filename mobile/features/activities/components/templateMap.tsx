import Mapbox from "@rnmapbox/maps";
import { View } from "react-native";
import { templateSummary } from "@/types/session";
import { Fullscreen } from "lucide-react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { LINE_COLORS } from "@/features/activities/lib/mapConstants";
import { useActivitySettingsStore } from "@/lib/stores/activitySettingsStore";

type MapProps = {
  template: templateSummary;
  setFullScreen: (value: boolean) => void;
};

export default function TemplateMap({ template, setFullScreen }: MapProps) {
  const defaultMapStyle = useActivitySettingsStore((s) => s.defaultMapStyle);
  const defaultLineColorIndex = useActivitySettingsStore(
    (s) => s.defaultLineColorIndex,
  );
  const lineColor = LINE_COLORS[defaultLineColorIndex];

  const coordinates = template.route!.coordinates;

  const routeFeature = {
    type: "Feature",
    geometry: template.route,
    properties: {},
  };

  const start = coordinates[0]!;
  const end = coordinates[coordinates.length - 1];

  const lons = coordinates.map((c) => c[0]);
  const lats = coordinates.map((c) => c[1]);

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
    <View style={{ height: 300 }}>
      <View pointerEvents="none" style={{ flex: 1 }}>
        <Mapbox.MapView
          style={{ flex: 1 }}
          styleURL={defaultMapStyle}
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
      <AnimatedButton
        onPress={() => setFullScreen(true)}
        className="absolute z-50 p-2 rounded-full bg-blue-700 border-2 border-blue-500"
        style={{ bottom: 15, right: 15 }}
        hitSlop={10}
      >
        <Fullscreen size={22} color="#f3f4f6" />
      </AnimatedButton>
    </View>
  );
}
