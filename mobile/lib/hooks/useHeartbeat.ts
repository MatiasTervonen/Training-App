import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { supabase } from "@/lib/supabase";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useUserStore } from "@/lib/stores/useUserStore";

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useHeartbeat(sessionChecked: boolean) {
  const role = useUserStore((s) => s.profile?.role);
  const activeSession = useTimerStore((s) => s.activeSession);
  const prevTrackingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Skip heartbeat for guest users
  useEffect(() => {
    if (!sessionChecked || role === "guest" || !role) return;

    const sendHeartbeat = () => {
      supabase.rpc("update_last_active", { p_platform: "mobile" });
    };

    const startInterval = () => {
      sendHeartbeat();
      intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startInterval();

    // Pause heartbeat when app is backgrounded, resume on foreground
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        stopInterval();
        startInterval();
      } else {
        stopInterval();
      }
    });

    return () => {
      stopInterval();
      subscription.remove();
    };
  }, [sessionChecked, role]);

  // Sync activity tracking status (skip for guests)
  useEffect(() => {
    if (!sessionChecked || role === "guest" || !role) return;

    const isTracking = activeSession !== null;
    if (isTracking === prevTrackingRef.current) return;
    prevTrackingRef.current = isTracking;

    supabase.rpc("set_tracking_status", { p_tracking: isTracking });
  }, [activeSession, sessionChecked, role]);
}
