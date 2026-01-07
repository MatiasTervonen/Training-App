import { full_activity_session } from "@/types/models";
import Mapbox from "@rnmapbox/maps";
import { View } from "react-native";
import { useState } from "react";

type MapProps = {
  activity_session: full_activity_session;
  setScrollEnabled: (value: boolean) => void;
  setSwipeEnabled: (value: boolean) => void;
};

export default function Map({
  activity_session,
  setScrollEnabled,
  setSwipeEnabled,
}: MapProps) {
  const [mapStyle, setMapStyle] = useState(Mapbox.StyleURL.Dark);

  const mapCoordinates = activity_session.activity_gps_points.map((point) => {
    return [point.longitude, point.latitude];
  });

  const start = mapCoordinates[0];
  const end = mapCoordinates[mapCoordinates.length - 1];

  const lons = mapCoordinates.map((c) => c[0]);
  const lats = mapCoordinates.map((c) => c[1]);

  const ne = [Math.max(...lons), Math.max(...lats)];
  const sw = [Math.min(...lons), Math.min(...lats)];

  const trackShape = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: mapCoordinates,
    },
  };

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
