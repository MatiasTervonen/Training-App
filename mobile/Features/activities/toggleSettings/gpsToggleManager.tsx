import Toggle from "@/components/toggle";
import { AppState, View } from "react-native";
import AppText from "@/components/AppText";
import { useUserStore } from "@/lib/stores/useUserStore";
import Toast from "react-native-toast-message";
import { updateGpsTrackingStatus } from "@/Features/activities/toggleSettings/actions";
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import InfoModal from "@/Features/activities/toggleSettings/infoModal";

export default function GpsToggleManager() {
  const [isOpen, setIsOpen] = useState(false);

  const gpsTrackingEnabled = useUserStore(
    (state) => state.settings?.gps_tracking_enabled
  );
  const settings = useUserStore.getState().settings;

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;

      const fg = await Location.getForegroundPermissionsAsync();
      const bg = await Location.getBackgroundPermissionsAsync();

      const granted = fg.status === "granted" && bg.status === "granted";

      if (granted) {
        useUserStore.getState().setUserSettings({
          gps_tracking_enabled: true,
        });
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

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
          text1: "Location Tracking disabled",
        });
      } catch (error) {
        console.error(error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to disable Location Tracking",
        });
      }
    } else {
      try {
        const fg = await Location.getForegroundPermissionsAsync();
        const bg = await Location.getBackgroundPermissionsAsync();

        const granted = fg.status === "granted" && bg.status === "granted";

        if (!granted) {
          setIsOpen(true);
          return;
        }

        await updateGpsTrackingStatus(true);

        useUserStore.getState().setUserSettings({
          gps_tracking_enabled: true,
        });

        Toast.show({
          type: "success",
          text1: "Location Tracking enabled",
        });
      } catch (error) {
        console.error(error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to enable Location Tracking",
        });
      }
    }
  };

  return (
    <View className="bg-slate-900 p-4 rounded-md">
      <AppText className="underline text-lg">Location Tracking</AppText>
      <View className="flex-row mt-5 items-center justify-between">
        <AppText>
          {gpsTrackingEnabled
            ? "Location Tracking Enabled"
            : "Allow Location Tracking"}
        </AppText>
        <View className="mr-5">
          <Toggle isOn={!!gpsTrackingEnabled} onToggle={handleToggle} />
        </View>
      </View>
      <InfoModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </View>
  );
}
