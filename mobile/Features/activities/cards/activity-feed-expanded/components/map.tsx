import { FullActivitySession } from "@/types/models";
import Mapbox from "@rnmapbox/maps";
import { View } from "react-native";
import { useMemo } from "react";
import {
  processSavedRoute,
  smoothMultiLineString,
} from "@/features/activities/lib/smoothCoordinates";

type MapProps = {
  activity_session: FullActivitySession;
  setScrollEnabled: (value: boolean) => void;
  setSwipeEnabled: (value: boolean) => void;
};

export default function Map({
  activity_session,
  setScrollEnabled,
  setSwipeEnabled,
}: MapProps) {
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

  // const MAP_STYLES = [
  //   Mapbox.StyleURL.Dark,
  //   Mapbox.StyleURL.SatelliteStreet,
  //   Mapbox.StyleURL.Street,
  // ];

  // const toggleMapStyle = () => {
  //   setMapStyle((prev) => {
  //     const currentIndex = MAP_STYLES.indexOf(prev);
  //     const nextIndex =
  //       currentIndex === -1 ? 0 : (currentIndex + 1) % MAP_STYLES.length;

  //     return MAP_STYLES[nextIndex];
  //   });
  // };

  return (
    <View
      style={{ height: 300 }}
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
  );
}
