import { useEffect, useState } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import { useSegments } from "expo-router";

export default function useScreenOrientation() {
  const segments = useSegments();
  const route = segments.join("/");

  const [orientation, setOrientation] =
    useState<ScreenOrientation.Orientation | null>(null);

  useEffect(() => {
    const getOrientation = async () => {
      const orientation = await ScreenOrientation.getOrientationAsync();
      setOrientation(orientation);
    };
    getOrientation();

    // Subscribe to orientation changes
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        setOrientation(event.orientationInfo.orientation);
      }
    );

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  // Lock screen orientation to portrait
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  // Check if screen is in landscape mode
  const isLandscape =
    orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
    orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;

  // Check if current route is the timer page
  const isTimerPage = route === "timer/empty-timer";
  const hideNawbar = isTimerPage && isLandscape;

  return { hideNawbar };
}
