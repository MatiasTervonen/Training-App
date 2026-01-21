import useForeground from "./useForeground";
import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { TrackPoint } from "@/types/session";
import { haversine } from "../lib/countDistance";
import { useTimerStore } from "@/lib/stores/timerStore";
import { detectMovement, createInitialState, MovementState } from "../lib/stationaryDetection";

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

  const hasStartedTrackingRef = useRef(false)

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
    }
  }, [activeSession, setHasStartedTracking]);

  // Sync lastAcceptedPointRef with the last point from hydrated track
  useEffect(() => {
    if (isHydrated && track.length > 0) {
      const lastPoint = track[track.length - 1];
      lastAcceptedPointRef.current = lastPoint;


      // Find last moving point for proper state reconstruction
      const lastMovingPoint = [...track].reverse().find((p) => !p.isStationary);


      movementStateRef.current = {
        confidence: lastPoint.isStationary ? 0 : 3,
        lastMovingPoint: lastMovingPoint
          ? {
            latitude: lastMovingPoint.latitude,
            longitude: lastMovingPoint.longitude,
            timestamp: lastMovingPoint.timestamp,
          }
          : null,
        lastAcceptedTimestamp: lastPoint.timestamp,
      };
    }
  }, [isHydrated, track]);

  // Start the location tracking when the component is in the foreground and the GPS is allowed and the activity is running
  // Wait for hydration to complete before starting to track
  useEffect(() => {
    if (!isForeground || !allowGPS || !isRunning || !isHydrated) return;

    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;

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


          // ------- GPS warm-up -------
          const isColdStart = (point.accuracy ?? Infinity) <= 20;

          if (!gpsReadyRef.current) {
            if (isColdStart) {
              goodFixCountRef.current += 1;
              if (goodFixCountRef.current >= 5) {
                gpsReadyRef.current = true;
              }
            } else {
              goodFixCountRef.current = 0;
            }

            return;
          }

          // ---------- Timestamp sanity ----------
          if (
            lastAcceptedPointRef.current &&
            point.timestamp <= lastAcceptedPointRef.current.timestamp
          ) {
            return;
          }


          const result = detectMovement(
            point,
            lastAcceptedPointRef.current,
            movementStateRef.current,
            haversine
          );

          movementStateRef.current = result.newState;

          if (!result.shouldSave) return;

          if (!hasStartedTrackingRef.current) {
            hasStartedTrackingRef.current = true;
            setHasStartedTracking(true);
          }

          // ---------- Save point ----------
          onPointRef.current({
            ...point,
            isStationary: !result.isMoving,
          });


          lastAcceptedPointRef.current = {
            ...point,
            isStationary: !result.isMoving,
          };
        }
      );

      if (cancelled) {
        newSub.remove(); // Created too late, clean it up immediately
      } else {
        sub = newSub;
      }
    };

    start();

    return () => {
      cancelled = true;
      sub?.remove(); // Clean up the subscription if it exists
    };
  }, [
    isForeground,
    allowGPS,
    isRunning,
    isHydrated,
    setHasStartedTracking,
  ]);
}
