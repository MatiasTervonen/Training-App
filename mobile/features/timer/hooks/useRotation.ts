import { useEffect, useState } from "react";
import * as ScreenOrientation from "expo-screen-orientation";

export default function useRotation() {
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

  const isLandscape =
    orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
    orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;

  useEffect(() => {
    // Allow full rotation on this page
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL);

    return () => {
      // Reset back to portrait when leaving the page
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
  }, []);

  return {
    isLandscape,
  };
}
