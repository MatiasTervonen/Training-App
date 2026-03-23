"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useUserStore } from "@/lib/stores/useUserStore";

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useHeartbeat() {
  const role = useUserStore((s) => s.role);
  const activeSession = useTimerStore((s) => s.activeSession);
  const prevTrackingRef = useRef(false);

  // Skip heartbeat for guest users
  useEffect(() => {
    if (role === "guest" || !role) return;

    const supabase = createClient();

    const sendHeartbeat = () => {
      supabase.rpc("update_last_active", { p_platform: "web" });
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [role]);

  // Sync activity tracking status (skip for guests)
  useEffect(() => {
    if (role === "guest" || !role) return;

    const isTracking = activeSession !== null;
    if (isTracking === prevTrackingRef.current) return;
    prevTrackingRef.current = isTracking;

    const supabase = createClient();
    supabase.rpc("set_tracking_status", { p_tracking: isTracking });
  }, [activeSession, role]);
}
