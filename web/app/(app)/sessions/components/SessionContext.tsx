"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTimerStore } from "@/app/(app)/lib/stores/timerStore";
import toast from "react-hot-toast";

export default function SessionsContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { activeSession } = useTimerStore();

  useEffect(() => {
    if (activeSession) {
      toast.error(
        "You already have an active session. Finish it before starting a new one."
      );
      router.push("/dashboard");
    }
  }, [router, activeSession]);

  if (activeSession) return null;

  return <>{children}</>;
}
