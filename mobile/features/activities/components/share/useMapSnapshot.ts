import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { FullActivitySession } from "@/types/models";
import MapboxGL from "@rnmapbox/maps";
import {
  processSavedRoute,
  smoothMultiLineString,
} from "@/features/activities/lib/smoothCoordinates";

type MapViewRef = MapboxGL.MapView;

/**
 * Fetches a Mapbox style JSON and strips all symbol (text/label) layers.
 * Cached per style URL so each style is only fetched once per app session.
 */
const noLabelsCache = new Map<string, string>();

async function getNoLabelsStyleJSON(mapboxStyleUrl: string): Promise<string> {
  const cached = noLabelsCache.get(mapboxStyleUrl);
  if (cached) return cached;

  const token = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN;
  // Convert mapbox:// URL to API URL
  const apiUrl = mapboxStyleUrl.replace(
    "mapbox://styles/",
    "https://api.mapbox.com/styles/v1/",
  );
  const res = await fetch(`${apiUrl}?access_token=${token}`);
  const style = await res.json();

  // Remove all symbol layers (text labels, POI icons, road labels, etc.)
  style.layers = style.layers.filter(
    (layer: { type: string }) => layer.type !== "symbol",
  );

  const json = JSON.stringify(style);
  noLabelsCache.set(mapboxStyleUrl, json);
  return json;
}

export default function useMapSnapshot(
  route: FullActivitySession["route"],
  hideDetails = false,
  resetKey?: string,
  mapStyleUrl?: string,
) {
  const mapViewRef = useRef<MapViewRef>(null);
  const [mapSnapshotUri, setMapSnapshotUri] = useState<string | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(!!route);
  const snappingRef = useRef(false);
  const genRef = useRef(0);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [noLabelsStyleJSON, setNoLabelsStyleJSON] = useState<string | null>(
    null,
  );

  // Fetch the no-labels style for the current map style when privacy mode is enabled
  useEffect(() => {
    if (!hideDetails || !route || !mapStyleUrl) return;

    let cancelled = false;
    setNoLabelsStyleJSON(null);
    getNoLabelsStyleJSON(mapStyleUrl).then((json) => {
      if (!cancelled) setNoLabelsStyleJSON(json);
    });
    return () => {
      cancelled = true;
    };
  }, [hideDetails, route, mapStyleUrl]);

  // Set loading synchronously during render when deps change so the spinner
  // shows in the same render cycle as the MapView remount (avoids race
  // conditions where onDidFinishLoadingMap fires before a useEffect would run).
  const depsKey = `${hideDetails}-${resetKey}`;
  const prevDepsKeyRef = useRef(depsKey);
  if (route && depsKey !== prevDepsKeyRef.current) {
    prevDepsKeyRef.current = depsKey;
    genRef.current += 1;
    snappingRef.current = false;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setIsLoadingSnapshot(true);
  }

  const isMultiLine = route?.type === "MultiLineString";

  const allCoordinates = useMemo(() => {
    if (!route) return [];
    if (isMultiLine) {
      return (route.coordinates as [number, number][][]).flat();
    }
    return route.coordinates as [number, number][];
  }, [route, isMultiLine]);

  const routeSegments = useMemo(() => {
    if (!route) return [];
    if (isMultiLine) {
      return smoothMultiLineString(
        route.coordinates as [number, number][][],
      );
    }
    return processSavedRoute(route.coordinates as [number, number][]);
  }, [route, isMultiLine]);

  const routeFeature = useMemo(() => {
    if (routeSegments.length === 0) return null;
    return {
      type: "Feature" as const,
      geometry: {
        type: "MultiLineString" as const,
        coordinates: routeSegments,
      },
      properties: {},
    };
  }, [routeSegments]);

  const bounds = useMemo(() => {
    if (allCoordinates.length === 0) return null;
    const lons = allCoordinates.map((c) => c[0]);
    const lats = allCoordinates.map((c) => c[1]);
    return {
      ne: [Math.max(...lons), Math.max(...lats)] as [number, number],
      sw: [Math.min(...lons), Math.min(...lats)] as [number, number],
    };
  }, [allCoordinates]);

  const startEndGeoJSON = useMemo(() => {
    if (allCoordinates.length === 0) return null;
    const start = allCoordinates[0];
    const end = allCoordinates[allCoordinates.length - 1];
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: { type: "start" },
          geometry: { type: "Point" as const, coordinates: start },
        },
        {
          type: "Feature" as const,
          properties: { type: "end" },
          geometry: { type: "Point" as const, coordinates: end },
        },
      ],
    };
  }, [allCoordinates]);

  // Whether the no-labels style is ready to use
  const privacyStyleReady = hideDetails && noLabelsStyleJSON !== null;

  const takeSnapshot = useCallback(async () => {
    if (!mapViewRef.current || snappingRef.current) return null;
    snappingRef.current = true;
    try {
      const uri = await mapViewRef.current.takeSnap(true);
      setMapSnapshotUri(uri);
      return uri;
    } catch (error) {
      console.error("Failed to take map snapshot:", error);
      return null;
    } finally {
      snappingRef.current = false;
    }
  }, []);

  const onMapDidFinishLoading = useCallback(() => {
    // Don't snapshot here — the ShapeSource route layer may not be rendered
    // yet. But set a fallback in case onMapIdle never fires (e.g. cached tiles).
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
    }
    const gen = genRef.current;
    fallbackTimerRef.current = setTimeout(async () => {
      fallbackTimerRef.current = null;
      if (gen !== genRef.current) return;
      const uri = await takeSnapshot();
      if (gen !== genRef.current) return;
      if (uri) setIsLoadingSnapshot(false);
    }, 3000);
  }, [takeSnapshot]);

  const onMapIdle = useCallback(async () => {
    // Cancel the fallback timer — idle fired normally
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    const gen = genRef.current;
    // Small delay to ensure the route ShapeSource layer is fully composited
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (gen !== genRef.current) return;
    const uri = await takeSnapshot();
    if (gen !== genRef.current) return;
    if (uri) setIsLoadingSnapshot(false);
  }, [takeSnapshot]);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  return {
    mapViewRef,
    mapSnapshotUri,
    isLoadingSnapshot,
    routeFeature,
    bounds,
    startEndGeoJSON,
    onMapDidFinishLoading,
    onMapIdle,
    noLabelsStyleJSON,
    privacyStyleReady,
  };
}
