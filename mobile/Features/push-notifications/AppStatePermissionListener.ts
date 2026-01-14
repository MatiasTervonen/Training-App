import { useUserStore } from "@/lib/stores/useUserStore";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { deleteTokenFromServer } from "./actions";

export default function AppStatePermissionListener() {
  // Listen for app state changes and update push notifications toggle state accordingly. Check permissions when app is opened.
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      const pushEnabled = useUserStore.getState().settings?.push_enabled;

      if (pushEnabled && status !== "granted") {
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
  }, []);
}
