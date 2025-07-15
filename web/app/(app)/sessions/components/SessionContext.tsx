"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTimerStore } from "@/app/(app)/lib/stores/timerStore";

export default function SessionsContext() {
  const router = useRouter();

  const { activeSession } = useTimerStore();

  useEffect(() => {
    if (activeSession) {
      alert(
        "You already have an active session. Finish it before starting a new one."
      );
      router.push("/dashboard");
    }
  }, [router, activeSession]);

  return <></>;
}
