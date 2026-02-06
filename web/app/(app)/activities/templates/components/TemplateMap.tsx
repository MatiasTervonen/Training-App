"use client";

import { useMemo } from "react";
import Image from "next/image";
import Map, { Source, Layer, Marker } from "react-map-gl/mapbox";
import { templateSummary } from "@/app/(app)/types/models";
import { processSavedRoute } from "@/app/(app)/activities/lib/smoothCoordinates";
import "mapbox-gl/dist/mapbox-gl.css";

type TemplateMapProps = {
  template: templateSummary;
};

export default function TemplateMap({ template }: TemplateMapProps) {
  const route = template.route;

  if (!route || route.coordinates.length === 0) {
    return null;
  }

  const allCoordinates = route.coordinates as [number, number][];

  const routeSegments = useMemo(() => {
    return processSavedRoute(allCoordinates);
  }, [allCoordinates]);

  const routeFeature = {
    type: "Feature" as const,
    geometry: {
      type: "MultiLineString" as const,
      coordinates: routeSegments,
    },
    properties: {},
  };

  const start = allCoordinates[0]!;
  const end = allCoordinates[allCoordinates.length - 1]!;

  const lons = allCoordinates.map((c) => c[0]);
  const lats = allCoordinates.map((c) => c[1]);

  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden">
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          bounds,
          fitBoundsOptions: {
            padding: 50,
          },
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        <Source id="route" type="geojson" data={routeFeature}>
          <Layer
            id="route-blur"
            type="line"
            paint={{
              "line-color": "rgba(59,130,246,0.4)",
              "line-width": 10,
              "line-blur": 4,
            }}
            layout={{
              "line-join": "round",
              "line-cap": "round",
            }}
          />
          <Layer
            id="route-core"
            type="line"
            paint={{
              "line-color": "#3b82f6",
              "line-width": 4,
            }}
            layout={{
              "line-join": "round",
              "line-cap": "round",
            }}
          />
        </Source>

        <Marker longitude={start[0]} latitude={start[1]} anchor="bottom">
          <Image src="/start-image.png" alt="Start" width={40} height={40} />
        </Marker>

        <Marker longitude={end[0]} latitude={end[1]} anchor="bottom">
          <Image src="/finnish-image.png" alt="Finish" width={40} height={40} />
        </Marker>
      </Map>
    </div>
  );
}
