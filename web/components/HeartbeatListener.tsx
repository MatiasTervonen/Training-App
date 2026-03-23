"use client";

import { useHeartbeat } from "@/lib/hooks/useHeartbeat";

export default function HeartbeatListener() {
  useHeartbeat();
  return null;
}
