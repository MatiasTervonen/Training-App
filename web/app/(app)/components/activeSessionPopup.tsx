"use client";

import { russoOne } from "@/app/ui/fonts";
import Link from "next/link";
import Timer from "./timer";
import { SquareArrowRight } from "lucide-react";
import { useTimerStore } from "@/app/(app)/lib/stores/timerStore";
import { useRef, useEffect } from "react";

export default function ActiveSessionPopup() {
  const activeSession = useTimerStore((state) => state.activeSession);
  const alarmFired = useTimerStore((state) => state.alarmFired);
  const setAlarmFired = useTimerStore((state) => state.setAlarmFired);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (alarmFired) {
      if (!audioRef.current) {
        audioRef.current = new Audio(
          "/timer-audio/mixkit-classic-alarm-995.wav"
        );
        audioRef.current.loop = true;
      }
      audioRef.current.play();
    }
  }, [alarmFired]);

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAlarmFired(false);
  };

  if (!activeSession) return null;

  return (
    <div
      onClick={stopAlarm}
      className={`flex flex-row justify-between items-center text-center bg-gray-300 py-4 sticky top-0 z-10 border-2 border-green-500 ${
        alarmFired ? "bg-red-500 animate-pulse" : ""
      }`}
    >
      <div className="ml-10">
        <p className={`${russoOne.className} pb-2 text-start ml-2`}>
          {activeSession.label}
        </p>
        <div
          className={`${russoOne.className} flex  gap-5 text-slate-900 text-start`}
        >
          <Timer />
          <p>{activeSession.type.toUpperCase()}</p>
          {alarmFired && <p className="text-gray-100">ALARM!</p>}
        </div>
      </div>
      <div className="mr-5">
        <Link onClick={stopAlarm} href={activeSession.path}>
          <SquareArrowRight size={40} />
        </Link>
      </div>
    </div>
  );
}
