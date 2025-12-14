"use client";

import SessionFeed from "@/app/(app)/dashboard/components/sessionFeed";
import { useRouter } from "next/navigation";
import { useModalPageConfig } from "@/app/(app)/lib/stores/modalPageConfig";
import { useTimerStore } from "@/app/(app)/lib/stores/timerStore";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { setModalPageConfig } = useModalPageConfig();
  const activeSession = useTimerStore((state) => state.activeSession);

  useEffect(() => {
    setModalPageConfig({
      leftLabel: "Menu",
      rightLabel: "Sessions",
      onSwipeLeft: () => router.push("/sessions"),
      onSwipeRight: () => router.push("/menu"),
    });
  }, [router, setModalPageConfig, activeSession]);

  return (
    <>
      <SessionFeed />
    </>
  );
}
