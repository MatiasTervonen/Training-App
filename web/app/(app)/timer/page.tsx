"use client";

import LinkButton from "@/components/buttons/LinkButton";
import toast from "react-hot-toast";
import { useTimerStore } from "@/lib/stores/timerStore";
import { List, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TimerPage() {
  const { t } = useTranslation("timer");
  const activeSession = useTimerStore((state) => state.activeSession);

  const handleClick = (e: React.MouseEvent) => {
    if (activeSession) {
      e.preventDefault();
      toast.error(
        `${t("timer.activeSessionError")} ${t("timer.activeSessionErrorSub")}`,
      );
      return;
    }
  };

  return (
    <div className="page-padding max-w-md mx-auto">
      <h1 className="text-2xl text-center mb-10">{t("timer.title")}</h1>
      <div className="flex flex-col gap-5 max-w-md mx-auto">
        <LinkButton href="/timer/empty-timer" onClick={handleClick}>
          {t("timer.startTimer")}
        </LinkButton>
        <LinkButton href="/timer/start-stopwatch" onClick={handleClick}>
          <p>{t("timer.startStopwatch")}</p>
          <Timer />
        </LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href="/timer/create-timer">
          {t("timer.createTimer")}
        </LinkButton>
        <LinkButton href="/timer/my-timers">
          <p>{t("timer.myTimers")}</p>
          <List />
        </LinkButton>
      </div>
    </div>
  );
}
