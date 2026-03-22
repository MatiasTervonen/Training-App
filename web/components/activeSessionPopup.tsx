"use client";

import Link from "next/link";
import Timer from "@/components/timer";
import { SquareArrowRight } from "lucide-react";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import {
  playAlarmAudio,
  stopAlarmAudio,
} from "@/features/timer/components/alarmAudio";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function ActiveSessionPopup() {
  const { t } = useTranslation(["gym", "timer"]);
  const pathname = usePathname();

  const {
    activeSession,
    alarmFired,
    alarmSoundPlaying,
    setAlarmSoundPlaying,
  } = useTimerStore();

  useEffect(() => {
    if (activeSession?.type === "habit") return;
    if (alarmSoundPlaying) {
      playAlarmAudio();
    } else {
      stopAlarmAudio();
    }
  }, [alarmSoundPlaying, activeSession?.type]);

  const handleStopTimer = () => {
    setAlarmSoundPlaying(false);
    stopAlarmAudio();
  };

  if (!activeSession) return null;

  if (pathname === "/gym/gym" && activeSession.type === t("gym:gym.title")) {
    return null;
  }

  if (
    pathname === "/timer/empty-timer" &&
    (activeSession.type === t("timer:timer.title") || activeSession.type === "timer" || activeSession.type === "habit")
  ) {
    return null;
  }

  if (pathname === "/habits" && activeSession.type === "habit") {
    return null;
  }

  if (pathname === "/disc-golf/game" && activeSession.type === "disc-golf") {
    return null;
  }

  if (
    pathname === "/timer/start-stopwatch" &&
    activeSession.type === t("timer:timer:stopwatchTitle")
  ) {
    return null;
  }

  return (
    <div
      onClick={handleStopTimer}
      className={`sticky w-full bg-slate-800 py-4 z-1000 border-[1.5px] border-blue-500 ${
        alarmFired ? "bg-red-500 animate-pulse" : ""
      }`}
    >
      <div className="flex flex-row items-center justify-between max-w-3xl mx-auto gap-5 px-5">
        <Timer textClassName="text-2xl" />
        {activeSession.label && (
          <p className="text-lg text-gray-100 truncate flex-1 text-center">
            {activeSession.label}
          </p>
        )}
        {alarmFired && (
          <p className="text-gray-100">
            {t("timer:timer.notification.alarm", "ALARM!")}
          </p>
        )}
        <Link onClick={handleStopTimer} href={activeSession.path}>
          <SquareArrowRight size={40} className="text-gray-100" />
        </Link>
      </div>
    </div>
  );
}
