"use client";

import Link from "next/link";
import Timer from "./timer";
import { SquareArrowRight } from "lucide-react";
import { useTimerStore } from "@/app/(app)/lib/stores/timerStore";
import { useEffect } from "react";
import {
  playAlarmAudio,
  stopAlarmAudio,
} from "@/app/(app)/timer/components/alarmAudio";
import { usePathname } from "next/navigation";

export default function ActiveSessionPopup() {
  const pathname = usePathname();

  const {
    activeSession,
    alarmFired,
    totalDuration,
    alarmSoundPlaying,
    setAlarmSoundPlaying,
  } = useTimerStore();

  useEffect(() => {
    if (alarmSoundPlaying) {
      playAlarmAudio();
    } else {
      stopAlarmAudio();
    }
  }, [alarmSoundPlaying]);

  const handleStopTimer = () => {
    setAlarmSoundPlaying(false);
    stopAlarmAudio();
  };

  if (!activeSession) return null;

  if (pathname === "/training/gym" && activeSession.type === "gym") {
    return null;
  }

  if (pathname === "/timer/empty-timer" && activeSession.type === "timer") {
    return null;
  }

  if (pathname === "/disc-golf/game" && activeSession.type === "disc-golf") {
    return null;
  }

  return (
    <div
      onClick={handleStopTimer}
      className={`sticky flex flex-row justify-between max-w-3xl items-center text-center w-full bg-gray-300 py-4 mx-auto z-1000 border-2 border-green-500 ${
        alarmFired ? "bg-red-500 animate-pulse" : ""
      }`}
    >
      <div className="ml-10">
        <p className="pb-2 text-start text-slate-900">{activeSession.label}</p>
        <div className="flex  gap-5 text-slate-900 text-start items-center">
          <Timer />
          <p>{activeSession.type.toUpperCase()}</p>
          {alarmFired && <p>ALARM!</p>}
          {activeSession.type === "timer" && totalDuration && (
            <p className="text-nowrap">
              {Math.floor(totalDuration / 60)} min {totalDuration % 60} sec
            </p>
          )}
        </div>
      </div>
      <div className="mr-5">
        <Link onClick={handleStopTimer} href={activeSession.path}>
          <SquareArrowRight size={40} color="#0f172b" />
        </Link>
      </div>
    </div>
  );
}
