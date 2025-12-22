import Toggle from "../toggle";
import AppText from "../AppText";
import { View, Platform, AppState } from "react-native";
import {
  deleteTokenFromServer,
  registerForPushNotificationsAsync,
  SaveTokenToServer,
} from "./actions";
import * as Notifications from "expo-notifications";
import { useUserStore } from "@/lib/stores/useUserStore";
import Toast from "react-native-toast-message";
import syncNotifications from "@/database/reminders/syncNotifications";
import { useEffect } from "react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function PushNotificationManager() {
  const pushEnabled = useUserStore((state) => state.settings?.push_enabled);

  const settings = useUserStore.getState().settings;

  const platform = Platform.OS === "ios" ? "ios" : "android";

  // Listen for app state changes and update push notifications toggle state accordingly. Check permissions when app is opened.
  useEffect(() => {
    const checkPermissions = async () => {
      if (!pushEnabled) return;

      const { status } = await Notifications.getPermissionsAsync();

      if (status !== "granted") {
        console.log("Deleting token from server");
        await deleteTokenFromServer();

        await Notifications.cancelAllScheduledNotificationsAsync();

        useUserStore.getState().setUserSettings({
          push_enabled: false,
        });
      }
    };

    checkPermissions();

    const subscription = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      checkPermissions();
    });

    return () => {
      subscription.remove();
    };
  }, [pushEnabled]);

  const subscribeToPush = async () => {
    if (!settings) return;

    try {
      const token = await registerForPushNotificationsAsync();

      if (!token) {
        throw new Error("No token received");
      }

      await SaveTokenToServer(token, platform);

      useUserStore.getState().setUserSettings({
        push_enabled: true,
      });

      await syncNotifications().catch(() => {});

      Toast.show({
        type: "success",
        text1: "Push notifications enabled",
      });
    } catch (error) {
      console.log("Error during push notification registration:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to enable push notifications",
      });
    }
  };

  async function handleToggle() {
    if (!settings) return;

    if (pushEnabled) {
      try {
        await deleteTokenFromServer();

        await Notifications.cancelAllScheduledNotificationsAsync();

        useUserStore.getState().setUserSettings({
          push_enabled: false,
        });

        Toast.show({
          type: "success",
          text1: "Push notifications disabled",
        });
      } catch (error) {
        console.log("Error during push notification unregistration:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to disable push notifications",
        });
      }
    } else {
      await subscribeToPush();
    }
  }

  return (
    <View className="bg-slate-900 p-4 rounded-md">
      <AppText className="underline text-lg">Push Notifications</AppText>
      <View className="flex-row mt-5 items-center justify-between">
        <AppText>
          {pushEnabled
            ? "Push notifications enabled"
            : "Allow push notifications"}
        </AppText>
        <View className="mr-5">
          <Toggle isOn={!!pushEnabled} onToggle={handleToggle} />
        </View>
      </View>
    </View>
  );
}
