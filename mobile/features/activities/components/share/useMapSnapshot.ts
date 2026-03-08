import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { FullActivitySession } from "@/types/models";
import MapboxGL from "@rnmapbox/maps";
import {
  processSavedRoute,
  smoothMultiLineString,
} from "@/features/activities/lib/smoothCoordinates";

type MapViewRef = MapboxGL.MapView;

/**
 * Fetches the Mapbox Dark style JSON and strips all symbol (text/label) layers.
 * Cached so it's only fetched once per app session.
 */
let cachedNoLabelsStyle: string | null = null;

async function getNoLabelsStyleJSON(): Promise<string> {
  if (cachedNoLabelsStyle) return cachedNoLabelsStyle;

  const token = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN;
  const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${token}`;

  const res = await fetch(url);
  const style = await res.json();

  // Remove all symbol layers (text labels, POI icons, road labels, etc.)
  style.layers = style.layers.filter(
    (layer: { type: string }) => layer.type !== "symbol",
  );

  cachedNoLabelsStyle = JSON.stringify(style);
  return cachedNoLabelsStyle;
}

export default function useMapSnapshot(
  route: FullActivitySession["route"],
  hideDetails = false,
  resetKey?: string,
) {
  const mapViewRef = useRef<MapViewRef>(null);
  const [mapSnapshotUri, setMapSnapshotUri] = useState<string | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(!!route);
  const snappingRef = useRef(false);
  const [noLabelsStyleJSON, setNoLabelsStyleJSON] = useState<string | null>(
    null,
  );

  // Fetch the no-labels style when privacy mode is enabled
  useEffect(() => {
    if (!hideDetails || !route) return;

    let cancelled = false;
    getNoLabelsStyleJSON().then((json) => {
      if (!cancelled) setNoLabelsStyleJSON(json);
    });
    return () => {
      cancelled = true;
    };
  }, [hideDetails, route]);

  // Re-take snapshot when style/color changes — keep old snapshot visible while loading
  useEffect(() => {
    if (!route) return;
    setIsLoadingSnapshot(true);
  }, [hideDetails, route, resetKey]);

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

  const onMapDidFinishLoading = useCallback(async () => {
    await takeSnapshot();
    setIsLoadingSnapshot(false);
  }, [takeSnapshot]);

  const onMapIdle = useCallback(async () => {
    await takeSnapshot();
    setIsLoadingSnapshot(false);
  }, [takeSnapshot]);

  return {
    mapViewRef,
    mapSnapshotUri,
    isLoadingSnapshot,
    routeFeature,
    bounds,
    startEndGeoJSON,
    onMapDidFinishLoading,
    onMapIdle,
    takeSnapshot,
    noLabelsStyleJSON,
    privacyStyleReady,
  };
}
