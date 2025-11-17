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

export default function ActiveSessionPopup() {
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

  return (
    <div
      onClick={handleStopTimer}
      className={`flex flex-row justify-between items-center text-center bg-gray-300 py-4 sticky top-0 z-10 border-2 border-green-500 ${
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
