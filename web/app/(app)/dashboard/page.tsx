"use client";

import SessionFeed from "@/features/dashboard/components/sessionFeed";
import { useRouter } from "next/navigation";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMedia } from "react-use";

export default function Home() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { setModalPageConfig } = useModalPageConfig();
  const activeSession = useTimerStore((state) => state.activeSession);
  const isDesktop = useMedia("(min-width: 1024px)", false);

  useEffect(() => {
    if (isDesktop) return;
    setModalPageConfig({
      leftLabel: t("navbar.menu"),
      rightLabel: t("navbar.sessions"),
      onSwipeLeft: () => router.push("/sessions"),
      onSwipeRight: () => router.push("/menu"),
    });
  }, [router, setModalPageConfig, activeSession, t, isDesktop]);

  return (
    <>
      <SessionFeed />
    </>
  );
}
