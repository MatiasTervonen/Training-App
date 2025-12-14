import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { supabase } from "../../lib/supabase";
import { handleError } from "@/utils/handleError";
import Constants from "expo-constants";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Alert, Linking } from "react-native";

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
      ],
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
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
  }

  const { error } = await supabase
    .from("user_push_mobile_subscriptions")
    .upsert(
      { token, platform, user_id: session.user.id },
      { onConflict: "user_id,platform" },
    );

  if (error) {
    handleError(error, {
      message: "Error saving push token",
      route: "/api/push/save-token",
      method: "POST",
    });
    throw new Error("Error saving push token");
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ push_enabled: true })
    .eq("id", session.user.id);

  if (updateError) {
    handleError(updateError, {
      message: "Error updating push_enabled status",
      route: "/api/push/save-token",
      method: "POST",
    });
    throw new Error("Error updating push_enabled status");
  }

  const { preferences, setUserPreferences } = useUserStore.getState();

  if (preferences) {
    setUserPreferences({ ...preferences, push_enabled: true });
  }

  return true;
}

export async function deleteTokenFromServer(token: string, platform: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
  }

  const { error } = await supabase
    .from("user_push_mobile_subscriptions")
    .delete()
    .eq("token", token)
    .eq("platform", platform)
    .eq("user_id", session.user.id);

  if (error) {
    handleError(error, {
      message: "Error deleting push token",
      route: "/api/push/delete-token",
      method: "DELETE",
    });
    throw new Error("Error deleting push token");
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ push_enabled: false })
    .eq("id", session.user.id);

  if (updateError) {
    handleError(updateError, {
      message: "Error updating push_enabled status",
      route: "/api/push/delete-token",
      method: "DELETE",
    });
    throw new Error("Error updating push_enabled status");
  }

  const { preferences, setUserPreferences } = useUserStore.getState();

  if (preferences) {
    setUserPreferences({ ...preferences, push_enabled: false });
  }

  return true;
}

export async function configureNotificationChannels() {
  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
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
