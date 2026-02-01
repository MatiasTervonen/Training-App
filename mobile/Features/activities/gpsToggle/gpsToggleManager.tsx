import Toggle from "@/components/toggle";
import { AppState, View } from "react-native";
import AppText from "@/components/AppText";
import { useUserStore } from "@/lib/stores/useUserStore";
import Toast from "react-native-toast-message";
import { updateGpsTrackingStatus } from "@/Features/activities/gpsToggle/actions";
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import InfoModal from "@/Features/activities/gpsToggle/infoModal";
import { useTranslation } from "react-i18next";

export default function GpsToggleManager() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const gpsTrackingEnabled = useUserStore(
    (state) => state.settings?.gps_tracking_enabled,
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
          text1: t("menu:settings.locationTracking.disabledToast"),
        });
      } catch (error) {
        console.error(error);
        Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: t("menu:settings.locationTracking.disableError"),
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
          text1: t("menu:settings.locationTracking.enabledToast"),
        });
      } catch (error) {
        console.error(error);
        Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: t("menu:settings.locationTracking.enableError"),
        });
      }
    }
  };

  return (
    <View className="bg-slate-900 p-4 rounded-md">
      <AppText className="underline text-lg">
        {t("menu:settings.locationTracking.title")}
      </AppText>
      <View className="flex-row mt-5 items-center justify-between">
        <AppText>
          {gpsTrackingEnabled
            ? t("menu:settings.locationTracking.enabled")
            : t("menu:settings.locationTracking.allow")}
        </AppText>
        <View className="mr-5">
          <Toggle isOn={!!gpsTrackingEnabled} onToggle={handleToggle} />
        </View>
      </View>
      <InfoModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </View>
  );
}
