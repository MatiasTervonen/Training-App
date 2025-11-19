"use client";

import SessionFeed from "../ui/homepage/sessionFeed";
import toast from "react-hot-toast";
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
      onSwipeLeft: () => {
        if (activeSession) {
          toast.error(
            "You already have an active session. Finish it before starting a new one."
          );
          return;
        }
        router.push("/sessions");
      },
      onSwipeRight: () => router.push("/menu"),
    });
  }, [router, setModalPageConfig, activeSession]);

  return (
    <>
      <SessionFeed />
    </>
  );
}
