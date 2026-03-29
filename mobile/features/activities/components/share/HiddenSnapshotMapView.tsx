import { View, PixelRatio } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { ShareCardSize } from "@/lib/share/themes";

const MAP_VIEW_STYLE = { flex: 1 };

const ROUTE_SCALE: Record<string, number> = {
  square: 1,
  story: 1.5,
  wide: 1.3,
};

type HiddenSnapshotMapViewProps = {
  mapViewRef: React.RefObject<Mapbox.MapView | null>;
  mapDims: { width: number; height: number };
  size: ShareCardSize;
  hideMapDetails: boolean;
  lineColorIndex: number;
  mapStyleIndex: number;
  lineColor: { glow: string; core: string };
  mapStyleUrl: string;
  noLabelsStyleJSON: string | null;
  routeFeature: GeoJSON.Feature;
  bounds: { ne: [number, number]; sw: [number, number] };
  startEndGeoJSON: GeoJSON.FeatureCollection | null;
  markersClose: boolean;
  onMapDidFinishLoading: () => void;
  onMapIdle: () => void;
};

export default function HiddenSnapshotMapView({
  mapViewRef,
  mapDims,
  size,
  hideMapDetails,
  lineColorIndex,
  mapStyleIndex,
  lineColor,
  mapStyleUrl,
  noLabelsStyleJSON,
  routeFeature,
  bounds,
  startEndGeoJSON,
  markersClose,
  onMapDidFinishLoading,
  onMapIdle,
}: HiddenSnapshotMapViewProps) {
  const pixelRatio = PixelRatio.get();

  return (
    <View
      style={{
        position: "absolute",
        top: -mapDims.height,
        left: 0,
        width: mapDims.width,
        height: mapDims.height,
        overflow: "hidden",
      }}
      pointerEvents="none"
    >
      <Mapbox.MapView
        ref={mapViewRef}
        key={`${size}-${hideMapDetails}-${lineColorIndex}-${mapStyleIndex}`}
        style={MAP_VIEW_STYLE}
        {...(hideMapDetails && noLabelsStyleJSON
          ? { styleJSON: noLabelsStyleJSON }
          : { styleURL: mapStyleUrl })}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={onMapDidFinishLoading}
        onMapIdle={onMapIdle}
      >
        {!hideMapDetails && (
          <Mapbox.Images
            images={{
              start: require("@/assets/images/start-image.png"),
              end: require("@/assets/images/finnish-image.png"),
            }}
          />
        )}
        <Mapbox.Camera
          defaultSettings={{
            bounds: {
              ne: bounds.ne,
              sw: bounds.sw,
              paddingTop: Math.round(mapDims.height * (size === "story" ? 0.32 : size === "square" ? 0.30 : 0.22)),
              paddingBottom: Math.round(mapDims.height * (size === "square" ? 0.33 : 0.38)),
              paddingLeft: Math.round(mapDims.width * 0.05),
              paddingRight: Math.round(mapDims.width * 0.05),
            },
          }}
          animationMode="none"
        />
        <Mapbox.ShapeSource
          id="snapshot-track"
          shape={routeFeature}
        >
          <Mapbox.LineLayer
            id="snapshot-glow"
            style={{
              lineColor: lineColor.glow,
              lineCap: "round" as const,
              lineJoin: "round" as const,
              lineWidth: (20 * (ROUTE_SCALE[size] ?? 1)) / pixelRatio,
              lineBlur: (8 * (ROUTE_SCALE[size] ?? 1)) / pixelRatio,
            }}
          />
          <Mapbox.LineLayer
            id="snapshot-core"
            aboveLayerID="snapshot-glow"
            style={{
              lineColor: lineColor.core,
              lineWidth: (9 * (ROUTE_SCALE[size] ?? 1)) / pixelRatio,
              lineCap: "round" as const,
              lineJoin: "round" as const,
            }}
          />
        </Mapbox.ShapeSource>
        {!hideMapDetails && startEndGeoJSON && (
          <Mapbox.ShapeSource
            id="snapshot-points"
            shape={startEndGeoJSON}
          >
            <Mapbox.SymbolLayer
              id="snapshot-points-layer"
              style={{
                iconImage: [
                  "case",
                  ["==", ["get", "type"], "start"],
                  "start",
                  "end",
                ],
                iconSize: (0.12 * (ROUTE_SCALE[size] ?? 1)) / pixelRatio,
                iconAnchor: "bottom",
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
                ...(markersClose && {
                  iconOffset: [
                    "match",
                    ["get", "type"],
                    "start",
                    ["literal", [-83, 0]],
                    "end",
                    ["literal", [83, 0]],
                    ["literal", [0, 0]],
                  ],
                }),
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
    </View>
  );
}
