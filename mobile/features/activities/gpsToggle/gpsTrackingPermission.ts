import { useUserStore } from "@/lib/stores/useUserStore";
import { useEffect } from "react";
import { AppState } from "react-native";
import { updateGpsTrackingStatus } from "./actions";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";

export default function GpsTrackingPermission() {
  // Listen for app state changes and update gps tracking toggle state accordingly. Check permissions when app is opened.
  useEffect(() => {
    const checkPermissions = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const fg = await Location.getForegroundPermissionsAsync();
      const bg = await Location.getBackgroundPermissionsAsync();

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
  }, []);
}
