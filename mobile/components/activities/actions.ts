import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import * as Location from "expo-location";
import { Alert, Linking } from "react-native";

export async function getGpsTrackingStatus() {
  const { data, error } = await supabase
    .from("user_settings")
    .select("gps_tracking_enabled")
    .single();

  if (error) {
    handleError(error, {
      message: "Error getting GPS tracking status",
      route: "/components/activities/actions.ts",
      method: "GET",
    });
    throw new Error("Error getting GPS tracking status");
  }

  return data;
}

export async function updateGpsTrackingStatus(status: boolean) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("user_settings")
    .update({ gps_tracking_enabled: status })
    .eq("user_id", session.user.id)
    .single();

  if (error) {
    console.error(error);
    handleError(error, {
      message: "Error updating GPS tracking status",
      route: "/components/activities/actions.ts",
      method: "POST",
    });
    throw new Error("Error updating GPS tracking status");
  }

  return data;
}

export async function registerForGpsTracking() {
  const fg = await Location.requestForegroundPermissionsAsync();

  if (fg.status !== "granted") {
    Alert.alert(
      "Location Permission Denied",
      "Please enable location permission to use GPS tracking.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== "granted") {
    Alert.alert(
      "Location Permission Denied",
      "Please enable location permission to use GPS tracking.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
}
