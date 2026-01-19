import useForeground from "./useForeground";
import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { TrackPoint } from "@/types/session";
import { haversine } from "../lib/countDistance";
import { useTimerStore } from "@/lib/stores/timerStore";

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
  const goodFixCountRef = useRef(0);
  const gpsReadyRef = useRef(false);
  const lastAcceptedPointRef = useRef<TrackPoint | null>(null);
  const wasMovingRef = useRef(true);
  const { activeSession } = useTimerStore();

  useEffect(() => {
    if (!activeSession) {
      gpsReadyRef.current = false;
      goodFixCountRef.current = 0;
      lastAcceptedPointRef.current = null;
      wasMovingRef.current = true;
      setHasStartedTracking(false);
    }
  }, [activeSession, setHasStartedTracking]);

  // Sync lastAcceptedPointRef with the last point from hydrated track
  useEffect(() => {
    if (isHydrated && track.length > 0) {
      lastAcceptedPointRef.current = track[track.length - 1];
    }
  }, [isHydrated, track]);

  // Start the location tracking when the component is in the foreground and the GPS is allowed and the activity is running
  // Wait for hydration to complete before starting to track
  useEffect(() => {
    if (!isForeground || !allowGPS || !isRunning || !isHydrated) return;

    let sub: Location.LocationSubscription | null = null;

    const start = async () => {
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 500, // 0.5 sec for smoother dot movement
          distanceInterval: 0, // Continuous updates for stationary detection
        },
        (location) => {
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

          const isColdStart = (point.accuracy ?? Infinity) <= 20;

          // When gps is cold starting avoid adding points to the track
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

          // Filter out low accuracy points
          if ((point.accuracy ?? Infinity) > 15) {
            return;
          }

          const isMoving = (point.speed ?? 0) >= 0.6;
          const isTransitionToStationary = !isMoving && wasMovingRef.current;

          // Filter out points too close to last accepted point
          // BUT allow stationary transition points through (they mark stop location)
          if (lastAcceptedPointRef.current && !isTransitionToStationary) {
            const d = haversine(
              lastAcceptedPointRef.current.latitude,
              lastAcceptedPointRef.current.longitude,
              point.latitude,
              point.longitude
            );
            if (d < 5) {
              return;
            }
          }

          // If already stationary and still stationary, don't save (jitter protection)
          if (!isMoving && !wasMovingRef.current) {
            return;
          }

          lastAcceptedPointRef.current = point;

          if (!hasStartedTracking) {
            setHasStartedTracking(true);
          }

          if (isMoving) {
            onPoint({ ...point, isStationary: false });
            wasMovingRef.current = true;
          } else {
            // isTransitionToStationary is true here
            onPoint({ ...point, isStationary: true });
            wasMovingRef.current = false;
          }
        }
      );
    };

    start();

    return () => {
      sub?.remove();
    };
  }, [
    isForeground,
    allowGPS,
    isRunning,
    isHydrated,
    onPoint,
    hasStartedTracking,
    setHasStartedTracking,
  ]);
}
