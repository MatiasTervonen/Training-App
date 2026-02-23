import { useCallback, useEffect, useRef } from "react";
import { getDatabase } from "@/database/local-database/database";
import { TrackPoint } from "@/types/session";
import useForeground from "./useForeground";
import { useTimerStore } from "@/lib/stores/timerStore";
import { handleError } from "@/utils/handleError";
import { debugLog } from "../lib/debugLogger";

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
  const lastHydratedCountRef = useRef(0);

  const hydrateFromDatabase = useCallback(async () => {
    if (isHydratingRef.current) {
      debugLog("HYDRATION", "Skipped — already hydrating");
      return;
    }
    isHydratingRef.current = true;
    setIsHydrated(false);
    debugLog("HYDRATION", "hydrateFromDatabase() called");

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

      const lastTs =
        points.length > 0
          ? new Date(points[points.length - 1].timestamp).toLocaleTimeString()
          : "none";
      const stationaryCount = points.filter((p) => p.isStationary).length;
      const badSignalCount = points.filter((p) => p.isBadSignal).length;
      debugLog(
        "HYDRATION",
        `Loaded ${points.length} pts (stationary=${stationaryCount}, badSignal=${badSignalCount}, last=${lastTs})`,
      );

      lastHydratedCountRef.current = points.length;
      setTrack(points);
      onHydrated(points);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      debugLog("HYDRATION", `ERROR: ${msg}`);
      handleError(error, {
        message: "Error hydrating from database",
        route: "/features/activities/hooks/useTrackHydration",
        method: "hydrateFromDatabase",
      });
    } finally {
      isHydratingRef.current = false;
    }
  }, [setTrack, onHydrated, setIsHydrated]);

  // Hydrate on initial mount if there's an active GPS session
  useEffect(() => {
    if (activeSession?.gpsAllowed) {
      debugLog("HYDRATION", "Initial mount hydration");
      hydrateFromDatabase();
    }
  }, [activeSession, hydrateFromDatabase]);

  useEffect(() => {
    const wasForeground = prevForegroundRef.current;
    prevForegroundRef.current = isForeground;

    // When going TO background, mark as not hydrated so the foreground tracker
    // won't start until hydration completes when we return
    if (wasForeground && !isForeground && activeSession?.gpsAllowed) {
      debugLog("BG_TRANSITION", "Going to background, setIsHydrated(false)");
      setIsHydrated(false);
    }

    // Also hydrate when coming back to foreground (regardless of isRunning)
    // Two-phase hydration:
    //   1. First hydration at 500ms — loads most points quickly
    //   2. Verification at 3s — catches late background saves the OS queued up
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let verifyTimeoutId: ReturnType<typeof setTimeout> | null = null;

    if (!wasForeground && isForeground && activeSession?.gpsAllowed) {
      debugLog("HYDRATION", "Foreground detected, starting 500ms timer");

      timeoutId = setTimeout(() => {
        debugLog("HYDRATION", "500ms timer fired, calling hydrateFromDatabase");
        hydrateFromDatabase();
      }, 500);

      // Verification: catch any late background saves from OS batch delivery
      verifyTimeoutId = setTimeout(async () => {
        try {
          const db = await getDatabase();
          const result = await db.getFirstAsync<{ cnt: number }>(
            "SELECT COUNT(*) as cnt FROM gps_points",
          );
          const dbCount = result?.cnt ?? 0;

          debugLog("HYDRATION", `Verification: DB has ${dbCount} pts`);

          if (dbCount > lastHydratedCountRef.current) {
            debugLog(
              "HYDRATION",
              `Late saves detected (${lastHydratedCountRef.current} → ${dbCount}), re-hydrating`,
            );
            hydrateFromDatabase();
          }
        } catch (error) {
          debugLog("HYDRATION", `Verification error: ${error}`);
        }
      }, 3000);
    }

    return () => {
      if (timeoutId) {
        debugLog("HYDRATION", "Timer cancelled (effect cleanup)");
        clearTimeout(timeoutId);
      }
      if (verifyTimeoutId) {
        clearTimeout(verifyTimeoutId);
      }
    };
  }, [isForeground, activeSession, hydrateFromDatabase, setIsHydrated]);
}
