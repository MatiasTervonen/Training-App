import Toggle from "../toggle";
import { View, AppState } from "react-native";
import AppText from "../AppText";
import { useUserStore } from "@/lib/stores/useUserStore";
import Toast from "react-native-toast-message";
import { registerForGpsTracking, updateGpsTrackingStatus } from "./actions";
import { useEffect } from "react";
import * as Location from "expo-location";

export default function GpsToggleManager() {
  const gpsTrackingEnabled = useUserStore(
    (state) => state.settings?.gps_tracking_enabled
  );
  const settings = useUserStore.getState().settings;

  // Listen for app state changes and update push notifications toggle state accordingly. Check permissions when app is opened.
  useEffect(() => {
    const checkPermissions = async () => {
      if (!gpsTrackingEnabled) return;

      const fg = await Location.requestForegroundPermissionsAsync();
      const bg = await Location.requestBackgroundPermissionsAsync();

      const granted = fg.status === "granted" && bg.status === "granted";

      if (!granted) {
        await updateGpsTrackingStatus(false);

        useUserStore.getState().setUserSettings({
          gps_tracking_enabled: false,
        });
      }
    };

    checkPermissions();

    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      checkPermissions();
    });

    return () => {
      sub.remove();
    };
  }, [gpsTrackingEnabled]);

  const handleToggle = async () => {
    if (!settings) return;

    if (gpsTrackingEnabled) {
      try {
        await updateGpsTrackingStatus(false);

        useUserStore.getState().setUserSettings({
          gps_tracking_enabled: false,
        });

        Toast.show({
          type: "success",
          text1: "GPS Tracking disabled",
        });
      } catch (error) {
        console.error(error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to disable GPS Tracking",
        });
      }
    } else {
      try {
        const granted = await registerForGpsTracking();

        if (!granted) return;

        await updateGpsTrackingStatus(true);

        useUserStore.getState().setUserSettings({
          gps_tracking_enabled: true,
        });

        Toast.show({
          type: "success",
          text1: "GPS Tracking enabled",
        });
      } catch (error) {
        console.error(error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to enable GPS Tracking",
        });
      }
    }
  };

  return (
    <View className="bg-slate-900 p-4 rounded-md">
      <AppText className="underline text-lg">GPS Tracking</AppText>
      <View className="flex-row mt-5 items-center justify-between">
        <AppText>
          {gpsTrackingEnabled ? "GPS Tracking Enabled" : "Allow GPS Tracking"}
        </AppText>
        <View className="mr-5">
          <Toggle isOn={!!gpsTrackingEnabled} onToggle={handleToggle} />
        </View>
      </View>
    </View>
  );
}
