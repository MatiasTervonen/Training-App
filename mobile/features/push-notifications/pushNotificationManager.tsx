import Toggle from "@/components/toggle";
import AppText from "@/components/AppText";
import { View, Platform, AppState } from "react-native";
import {
  deleteTokenFromServer,
  registerForPushNotificationsAsync,
  SaveTokenToServer,
} from "./actions";
import * as Notifications from "expo-notifications";
import { useUserStore } from "@/lib/stores/useUserStore";
import Toast from "react-native-toast-message";
import { syncNotifications } from "@/database/reminders/syncNotifications";
import { syncHabitNotifications } from "@/database/habits/syncHabitNotifications";
import { useEffect } from "react";
import { syncAlarms } from "@/database/reminders/syncAlarms";
import { cancelAllNativeAlarms } from "@/native/android/NativeAlarm";
import { useTranslation } from "react-i18next";
import { updatePushEnabledStatus } from "./updatePushEnabledStatus";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function PushNotificationManager() {
  const { t } = useTranslation("menu");
  const pushEnabled = useUserStore((state) => state.settings?.push_enabled);

  const settings = useUserStore.getState().settings;

  const platform = Platform.OS === "ios" ? "ios" : "android";

  const subscribeToPush = async () => {
    if (!settings) return;

    try {
      const token = await registerForPushNotificationsAsync(t);

      if (!token) {
        throw new Error("No token received");
      }

      await SaveTokenToServer(token, platform);

      await updatePushEnabledStatus(true);
      useUserStore.getState().setUserSettings({
        push_enabled: true,
      });

      Toast.show({
        type: "success",
        text1: t("settings.pushNotifications.enabledToast"),
      });

      // Sync notifications in the background — non-critical
      Promise.all([
        syncNotifications(),
        syncHabitNotifications(),
        platform === "android" ? syncAlarms() : Promise.resolve(),
      ]).catch(() => {});
    } catch {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("settings.pushNotifications.enableError"),
      });
    }
  };

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;

      const allowed = await Notifications.getPermissionsAsync();

      if (allowed.status === "granted") {
        useUserStore.getState().setUserSettings({
          push_enabled: true,
        });
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  async function handleToggle() {
    if (!settings) return;

    if (pushEnabled) {
      try {
        await deleteTokenFromServer();

        await Promise.all([
          Notifications.cancelAllScheduledNotificationsAsync(),
          Platform.OS === "android"
            ? cancelAllNativeAlarms()
            : Promise.resolve(),
        ]);

        await updatePushEnabledStatus(false);
        useUserStore.getState().setUserSettings({
          push_enabled: false,
        });

        Toast.show({
          type: "success",
          text1: t("settings.pushNotifications.disabledToast"),
        });
      } catch {
        Toast.show({
          type: "error",
          text1: t("common:common.error"),
          text2: t("settings.pushNotifications.disableError"),
        });
      }
    } else {
      await subscribeToPush();
    }
  }

  return (
    <View className="bg-slate-500/10 border border-slate-500/20 rounded-lg p-4">
      <AppText className="underline text-lg">
        {t("settings.pushNotifications.title")}
      </AppText>
      <View className="flex-row mt-5 items-center justify-between">
        <AppText>
          {pushEnabled
            ? t("settings.pushNotifications.enabled")
            : t("settings.pushNotifications.allow")}
        </AppText>
        <View className="mr-5">
          <Toggle isOn={!!pushEnabled} onToggle={handleToggle} />
        </View>
      </View>
    </View>
  );
}
