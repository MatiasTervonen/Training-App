"use client";

import SessionFeed from "../ui/homepage/sessionFeed";
import { useRouter } from "next/navigation";
import { useModalPageConfig } from "../lib/stores/modalPageConfig";
import { useTimerStore } from "../lib/stores/timerStore";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { setModalPageConfig } = useModalPageConfig();
  const { activeSession } = useTimerStore();

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
