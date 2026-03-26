"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Map, { Source, Layer, Marker } from "react-map-gl/mapbox";
import { FullActivitySession } from "@/types/models";
import {
  processSavedRoute,
  smoothMultiLineString,
} from "@/features/activities/lib/smoothCoordinates";
import "mapbox-gl/dist/mapbox-gl.css";

type RouteMapProps = {
  activity_session: FullActivitySession;
};

export default function RouteMap({ activity_session }: RouteMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const route = activity_session.route!;
  const isMultiLine = route.type === "MultiLineString";

  const allCoordinates = useMemo(() => {
    if (isMultiLine) {
      return (route.coordinates as [number, number][][]).flat();
    }
    return route.coordinates as [number, number][];
  }, [route, isMultiLine]);

  const routeSegments = useMemo(() => {
    if (isMultiLine) {
      return smoothMultiLineString(route.coordinates as [number, number][][]);
    }
    return processSavedRoute(route.coordinates as [number, number][]);
  }, [route, isMultiLine]);

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

  const mapSpan = Math.sqrt(
    (bounds[1][0] - bounds[0][0]) ** 2 + (bounds[1][1] - bounds[0][1]) ** 2,
  );
  const startEndDist = Math.sqrt(
    (start[0] - end[0]) ** 2 + (start[1] - end[1]) ** 2,
  );
  const markersClose = mapSpan === 0 || startEndDist / mapSpan < 0.05;

  return (
    <div className="h-[400px] w-full rounded-t-lg overflow-hidden relative">
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse rounded-t-lg" />
      )}
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
        onLoad={() => setMapLoaded(true)}
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
          <div style={markersClose ? { transform: "translateX(-10px)" } : undefined}>
            <Image src="/start-image.png" alt="Start" width={28} height={28} />
          </div>
        </Marker>

        <Marker longitude={end[0]} latitude={end[1]} anchor="bottom">
          <div style={markersClose ? { transform: "translateX(10px)" } : undefined}>
            <Image src="/finnish-image.png" alt="Finish" width={28} height={28} />
          </div>
        </Marker>
      </Map>
    </div>
  );
}
