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
}: {
  allowGPS: boolean;
  isRunning: boolean;
  onPoint: (point: TrackPoint) => void;
  setHasStartedTracking: (hasStartedTracking: boolean) => void;
  hasStartedTracking: boolean;
}) {
  const { isForeground } = useForeground();
  const goodFixCountRef = useRef(0);
  const gpsReadyRef = useRef(false);
  const lastAcceptedPointRef = useRef<TrackPoint | null>(null);
  const { activeSession } = useTimerStore();

  useEffect(() => {
    if (!activeSession) {
      gpsReadyRef.current = false;
      goodFixCountRef.current = 0;
      lastAcceptedPointRef.current = null;
      setHasStartedTracking(false);
    }
  }, [activeSession, setHasStartedTracking]);

  // Start the location tracking when the component is in the foreground and the GPS is allowed and the activity is running
  useEffect(() => {
    if (!isForeground || !allowGPS || !isRunning) return;

    let sub: Location.LocationSubscription | null = null;

    const start = async () => {
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 500,
          distanceInterval: 5,
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

          // Filter out stationary points (speed less than 0.6 m/s ≈ 2 km/h)
          if ((point.speed ?? 0) < 0.6) {
            return;
          }

          // Filter out points too close to last accepted point
          if (lastAcceptedPointRef.current) {
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

          lastAcceptedPointRef.current = point;

          if (!hasStartedTracking) {
            setHasStartedTracking(true);
          }

          onPoint(point);
        }
      );
    };

    start();

    return () => {
      sub?.remove();
    };
  }, [isForeground, allowGPS, isRunning, onPoint, hasStartedTracking]);
}
