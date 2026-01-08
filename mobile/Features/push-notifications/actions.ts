import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import Constants from "expo-constants";
import { Alert, Linking } from "react-native";
import { getDeviceId } from "@/utils/deviceId";

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log("Push notifications only work on a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert(
      "Notifications Disabled",
      "Enable notifications from your device settings to receive updates.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]
    );
    return;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) {
    handleRegistrationError("Project ID not found");
  }

  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    return pushTokenString;
  } catch (e: unknown) {
    handleRegistrationError(`${e}`);
  }
}

export async function SaveTokenToServer(token: string, platform: string) {
  const deviceId = await getDeviceId();

  const { error } = await supabase
    .from("user_push_mobile_subscriptions")
    .upsert(
      {
        token,
        platform,
        is_active: true,
        device_id: deviceId,
      },
      {
        onConflict: "user_id,device_id",
      }
    );

  if (error) {
    console.log("Error saving push token", error);
    handleError(error, {
      message: "Error saving push token",
      route: "/api/push/save-token",
      method: "POST",
    });
    throw new Error("Error saving push token");
  }

  return true;
}

export async function deleteTokenFromServer() {
  const deviceId = await getDeviceId();

  console.log("Deleting token from server", deviceId);

  const { error } = await supabase
    .from("user_push_mobile_subscriptions")
    .delete()
    .eq("device_id", deviceId);

  if (error) {
    handleError(error, {
      message: "Error deleting push token",
      route: "/api/push/delete-token",
      method: "DELETE",
    });
    throw new Error("Error deleting push token");
  }

  return true;
}

export async function configureNotificationChannels() {
  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });

  await Notifications.setNotificationChannelAsync("alarm", {
    name: "Alarm Reminders",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    vibrationPattern: [0, 1000, 500, 1000],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function configurePushNotificationsWhenAppIsOpen() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
