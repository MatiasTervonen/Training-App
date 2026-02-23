import useForeground from "./useForeground";
import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { TrackPoint } from "@/types/session";
import { haversine } from "../lib/countDistance";
import { useTimerStore } from "@/lib/stores/timerStore";
import {
  detectMovement,
  createInitialState,
  MovementState,
} from "../lib/stationaryDetection";
import { debugLog } from "../lib/debugLogger";

export function useForegroundLocationTracker({
  allowGPS,
  isRunning,
  onPoint,
  setHasStartedTracking,
  hasStartedTracking,
  isHydrated,
  track,
}: {
  allowGPS: boolean;
  isRunning: boolean;
  onPoint: (point: TrackPoint) => void;
  setHasStartedTracking: (hasStartedTracking: boolean) => void;
  hasStartedTracking: boolean;
  isHydrated: boolean;
  track: TrackPoint[];
}) {
  const { isForeground } = useForeground();
  const { activeSession } = useTimerStore();

  const goodFixCountRef = useRef(0);
  const gpsReadyRef = useRef(false);
  const lastAcceptedPointRef = useRef<TrackPoint | null>(null);
  const onPointRef = useRef(onPoint);

  const movementStateRef = useRef<MovementState>(createInitialState());

  const hasStartedTrackingRef = useRef(false);

  // Warmup state for UI feedback
  const [isGpsWarmingUp, setIsGpsWarmingUp] = useState(false);

  // Current position for user dot (updates even during warmup)
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null>(null);

  // Warmup config for background->foreground transitions
  // Must match ACCURACY_THRESHOLD in stationaryDetection to prevent false gaps
  const WARMUP_ACCURACY_THRESHOLD = 25; // meters
  const WARMUP_REQUIRED_FIXES = 3; // consecutive good fixes needed

  // Keep onPoint stable
  useEffect(() => {
    onPointRef.current = onPoint;
  }, [onPoint]);

  useEffect(() => {
    hasStartedTrackingRef.current = hasStartedTracking;
  }, [hasStartedTracking]);

  useEffect(() => {
    if (!activeSession) {
      gpsReadyRef.current = false;
      goodFixCountRef.current = 0;
      lastAcceptedPointRef.current = null;
      hasStartedTrackingRef.current = false;
      movementStateRef.current = createInitialState();
      setHasStartedTracking(false);
      setIsGpsWarmingUp(false);
      setCurrentPosition(null);
    }
  }, [activeSession, setHasStartedTracking]);

  // Sync lastAcceptedPointRef with the last point from hydrated track
  // Only runs on hydration transition (false→true), not on every track change
  const prevHydratedRef = useRef(false);
  useEffect(() => {
    const wasHydrated = prevHydratedRef.current;
    prevHydratedRef.current = isHydrated;

    // Skip if not a hydration transition or already synced
    if (wasHydrated || !isHydrated || track.length === 0) return;

    const lastPoint = track[track.length - 1];
    lastAcceptedPointRef.current = lastPoint;

    // Find last moving point for proper state reconstruction
    const lastMovingPoint = track.findLast((p) => !p.isStationary && !p.isBadSignal);

    // Count consecutive bad signal points at the end of track
    let badSignalCount = 0;
    for (let i = track.length - 1; i >= 0; i--) {
      if (track[i].isBadSignal) {
        badSignalCount++;
      } else {
        break;
      }
    }

    movementStateRef.current = {
      confidence: lastPoint.confidence ?? 0,
      badSignalCount,
      lastMovingPoint: lastMovingPoint
        ? {
            latitude: lastMovingPoint.latitude,
            longitude: lastMovingPoint.longitude,
            timestamp: lastMovingPoint.timestamp,
          }
        : null,
      lastAcceptedTimestamp: lastPoint.timestamp,
    };

    debugLog(
      "FG_TRACKER",
      `Synced lastAcceptedPoint from hydrated track (${track.length} pts, badSignal=${badSignalCount})`,
    );
  }, [isHydrated, track]);

  // Start the location tracking when the component is in the foreground and the GPS is allowed and the activity is running
  // Wait for hydration to complete before starting to track
  useEffect(() => {
    if (!isForeground || !allowGPS || !isRunning || !isHydrated) return;

    debugLog(
      "FG_TRACKER",
      `Starting GPS watch (fg=${isForeground}, gps=${allowGPS}, run=${isRunning}, hyd=${isHydrated})`,
    );

    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;

    // Reset warmup state when coming to foreground
    // This filters out GPS spikes that often occur after background
    gpsReadyRef.current = false;
    goodFixCountRef.current = 0;

    // Only show warmup UI if we have existing track (coming back from background)
    // Use lastAcceptedPointRef instead of track.length to avoid dependency issues
    if (lastAcceptedPointRef.current) {
      setIsGpsWarmingUp(true);
    }

    const start = async () => {
      const newSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 500, // 0.5 sec for smoother dot movement
          distanceInterval: 1,
        },
        (location) => {
          if (cancelled) return;

          const point: TrackPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude ?? null,
            accuracy: location.coords.accuracy ?? null,
            speed: location.coords.speed ?? null,
            heading: location.coords.heading ?? null,
            timestamp: location.timestamp,
            isStationary: false,
          };

          // ---------- Timestamp sanity ----------
          if (
            lastAcceptedPointRef.current &&
            point.timestamp <= lastAcceptedPointRef.current.timestamp
          ) {
            return;
          }

          // Always update current position for user dot (even during warmup)
          setCurrentPosition({
            latitude: point.latitude,
            longitude: point.longitude,
            accuracy: point.accuracy ?? null,
          });

          // ---------- Warmup after foreground resume ----------
          // Wait for N consecutive good accuracy fixes before accepting points
          // This filters out GPS spikes that occur when coming from background
          if (!gpsReadyRef.current) {
            const accuracy = point.accuracy ?? Infinity;
            if (accuracy <= WARMUP_ACCURACY_THRESHOLD) {
              goodFixCountRef.current += 1;
              if (goodFixCountRef.current >= WARMUP_REQUIRED_FIXES) {
                gpsReadyRef.current = true;
                setIsGpsWarmingUp(false);
                debugLog("FG_TRACKER", `GPS ready after warmup (acc=${accuracy.toFixed(0)}m)`);
              }
            } else {
              goodFixCountRef.current = 0; // Reset on bad fix
            }

            if (!gpsReadyRef.current) {
              debugLog("FG_TRACKER", `Warmup: ${goodFixCountRef.current}/${WARMUP_REQUIRED_FIXES} fixes (acc=${accuracy.toFixed(0)}m)`);
              return; // Skip this point, warmup not complete
            }
          }

          const result = detectMovement(
            point,
            lastAcceptedPointRef.current,
            movementStateRef.current,
            haversine,
          );

          movementStateRef.current = result.newState;

          if (!result.shouldSave) return;

          if (!hasStartedTrackingRef.current) {
            hasStartedTrackingRef.current = true;
            setHasStartedTracking(true);
          }

          // ---------- Save point ----------
          debugLog(
            "FG_TRACKER",
            `Point saved (acc=${(point.accuracy ?? 0).toFixed(0)}m, moving=${result.isMoving}, badSig=${result.isBadSignal})`,
          );
          onPointRef.current({
            ...point,
            isStationary: result.isBadSignal ? false : !result.isMoving, // Don't mark as stationary if bad signal
            isBadSignal: result.isBadSignal,
            confidence: result.newState.confidence,
          });

          lastAcceptedPointRef.current = {
            ...point,
            isStationary: result.isBadSignal ? false : !result.isMoving,
            isBadSignal: result.isBadSignal,
          };
        },
      );

      if (cancelled) {
        newSub.remove(); // Created too late, clean it up immediately
      } else {
        sub = newSub;
      }
    };

    start();

    return () => {
      debugLog("FG_TRACKER", "GPS watch cleaned up");
      cancelled = true;
      sub?.remove(); // Clean up the subscription if it exists
    };
  }, [isForeground, allowGPS, isRunning, isHydrated, setHasStartedTracking]);

  return { isGpsWarmingUp, currentPosition };
}
