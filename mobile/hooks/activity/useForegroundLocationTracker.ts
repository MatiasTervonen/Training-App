import useForeground from "./useForegound";
import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { TrackPoint } from "@/types/session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTimerStore } from "@/lib/stores/timerStore";

export function useForegroundLocationTracker({
  setTrack,
  allowGPS,
  isRunning,
  setColdStartCount,
}: {
  setTrack: React.Dispatch<React.SetStateAction<TrackPoint[]>>;
  allowGPS: boolean;
  isRunning: boolean;
  setColdStartCount: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { isForeground } = useForeground();

  const lastPersistRef = useRef(0);
  const trackRef = useRef<TrackPoint[]>([]);
  const hydratedRef = useRef(false); // used to read asyncStorage only once when in foreground. Reads the data what bg job saved to the async storage and syncs it to trackRef.
  const goodFixCountRef = useRef(0);
  const gpsReadyRef = useRef(false);

  const { activeSession } = useTimerStore();

  // resset states when the activity is ended.
  useEffect(() => {
    if (!activeSession) {
      hydratedRef.current = false;
      hydratedRef.current = false;
      goodFixCountRef.current = 0;
      trackRef.current = [];
    }
  }, [activeSession]);

  // Read the asyncStroage once and set track when back to foreground
  useEffect(() => {
    if (!isForeground || !isRunning || hydratedRef.current) return;

    const hydrate = async () => {
      const stored = await AsyncStorage.getItem("activity_draft");

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.track)) {
          setTrack(parsed.track);
          trackRef.current = parsed.track;
        }

        hydratedRef.current = true;
        lastPersistRef.current = Date.now();
      }
    };

    hydrate();
  }, [isForeground, isRunning, setTrack]);

  // Reset the hydratedRef when the component is not in the foreground
  useEffect(() => {
    if (!isForeground) {
      hydratedRef.current = false;
    }
  }, [isForeground]);

  // Start the location tracking when the component is in the foreground and the GPS is allowed and the activity is running
  useEffect(() => {
    if (!isForeground || !allowGPS || !isRunning) return;

    console.log("START FG LOCATION");

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

          const isColdStart = point.accuracy ?? Infinity <= 20;

          // When gps is cold starting avoid adding points to the track
          if (!gpsReadyRef.current) {
            if (isColdStart) {
              setColdStartCount(true);
              goodFixCountRef.current += 1;
              if (goodFixCountRef.current >= 5) {
                gpsReadyRef.current = true;
                setColdStartCount(false);
              }
            } else {
              goodFixCountRef.current = 0;
            }

            return;
          }

          const isMoving = point.accuracy ?? Infinity <= 20;

          setTrack((prev) => {
            if (!isMoving) return prev;

            const nextTrack = [...prev, point];
            trackRef.current = nextTrack;
            return nextTrack;
          });

          const now = Date.now();
          if (now - lastPersistRef.current >= 5000) {
            lastPersistRef.current = now;
            AsyncStorage.mergeItem(
              "activity_draft",
              JSON.stringify({ track: trackRef.current })
            );
          }
        }
      );
    };

    start();

    return () => {
      console.log("STOP FG LOCATION");
      sub?.remove();

      // persist the track when the component unmounts
      AsyncStorage.mergeItem(
        "activity_draft",
        JSON.stringify({ track: trackRef.current })
      );
    };
  }, [isForeground, allowGPS, isRunning, setTrack, setColdStartCount]);
}
