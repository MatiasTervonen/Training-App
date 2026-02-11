import Mapbox from "@rnmapbox/maps";
import { Pressable, View } from "react-native";
import { useEffect, useState } from "react";
import { templateSummary } from "@/types/session";
import { Move, Lock } from "lucide-react-native";

type MapProps = {
  template: templateSummary;
  setScrollEnabled: (value: boolean) => void;
  setSwipeEnabled: (value: boolean) => void;
};

export default function TemplateMap({
  template,
  setScrollEnabled,
  setSwipeEnabled,
}: MapProps) {
  const [mapActive, setMapActive] = useState(false);

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

  const toggleMapActive = () => {
    const next = !mapActive;
    setMapActive(next);
    setScrollEnabled(!next);
    setSwipeEnabled(!next);
  };

  useEffect(() => {
    return () => {
      setSwipeEnabled(true);
      setScrollEnabled(true);
    };
  }, [setSwipeEnabled, setScrollEnabled]);

  return (
    <View style={{ height: 300 }}>
      <View pointerEvents={mapActive ? "auto" : "none"} style={{ flex: 1 }}>
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
      <Pressable
        onPress={toggleMapActive}
        className="absolute z-50 p-2 rounded-full bg-blue-700 border-2 border-blue-500"
        style={{ bottom: 15, right: 25 }}
        hitSlop={10}
      >
        {mapActive ? (
          <Lock size={22} color="#f3f4f6" />
        ) : (
          <Move size={22} color="#f3f4f6" />
        )}
      </Pressable>
    </View>
  );
}
