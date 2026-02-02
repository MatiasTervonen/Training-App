import { useCallback, useEffect, useRef } from "react";
import { getDatabase } from "@/database/local-database/database";
import { TrackPoint } from "@/types/session";
import useForeground from "./useForeground";
import { useTimerStore } from "@/lib/stores/timerStore";
import { handleError } from "@/utils/handleError";
import Toast from "react-native-toast-message";

export function useTrackHydration({
  setTrack,
  onHydrated,
  setIsHydrated,
}: {
  setTrack: React.Dispatch<React.SetStateAction<TrackPoint[]>>;
  onHydrated: (points: TrackPoint[]) => void;
  setIsHydrated: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { isForeground } = useForeground();
  const prevForegroundRef = useRef(false);
  const activeSession = useTimerStore((state) => state.activeSession);
  const isHydratingRef = useRef(false);

  const hydrateFromDatabase = useCallback(async () => {
    if (isHydratingRef.current) return;
    isHydratingRef.current = true;
    setIsHydrated(false);

    try {
      const db = await getDatabase();

      const result = await db.getAllAsync<{
        timestamp: number;
        latitude: number;
        longitude: number;
        altitude: number | null;
        accuracy: number | null;
        is_stationary: number;
        confidence: number;
        bad_signal: number;
      }>(
        "SELECT timestamp, latitude, longitude, altitude, accuracy, is_stationary, confidence, bad_signal FROM gps_points ORDER BY timestamp ASC",
      );

      const points: TrackPoint[] = result.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
        altitude: point.altitude,
        accuracy: point.accuracy,
        timestamp: point.timestamp,
        isStationary: point.is_stationary === 1,
        isBadSignal: point.bad_signal === 1,
        confidence: point.confidence,
      }));

      setTrack(points);
      onHydrated(points);

      // DEBUG: Remove after testing
      Toast.show({
        type: "info",
        text1: `Hydrated: ${points.length} points`,
        text2: points.length > 0 ? `Last: ${new Date(points[points.length - 1].timestamp).toLocaleTimeString()}` : "No points",
      });
    } catch (error) {
      handleError(error, {
        message: "Error hydrating from database",
        route: "/features/activities/hooks/useTrackHydration",
        method: "hydrateFromDatabase",
      });
    } finally {
      isHydratingRef.current = false;
    }
  }, [setTrack, onHydrated, setIsHydrated]);

  // Hydrate on initial mount if there's an active session
  useEffect(() => {
    if (activeSession) {
      hydrateFromDatabase();
    }
  }, [activeSession, hydrateFromDatabase]);

  useEffect(() => {
    const wasForeground = prevForegroundRef.current;
    prevForegroundRef.current = isForeground;

    // When going TO background, mark as not hydrated so the foreground tracker
    // won't start until hydration completes when we return
    if (wasForeground && !isForeground && activeSession) {
      setIsHydrated(false);
    }

    // Also hydrate when coming back to foreground (regardless of isRunning)
    // Delay to allow background task to finish any pending database writes
    let timeoutId: NodeJS.Timeout | null = null;
    if (!wasForeground && isForeground && activeSession) {
      timeoutId = setTimeout(() => {
        hydrateFromDatabase();
      }, 500);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isForeground, activeSession, hydrateFromDatabase, setIsHydrated]);
}
