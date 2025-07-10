"use client";

import { russoOne } from "@/app/ui/fonts";
import { CirclePlay, CirclePause } from "lucide-react";
import { useTimerStore } from "@/app/(app)/lib/stores/timerStore";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
};

type TimerProps = {
  className?: string;
  buttonsAlwaysVisible?: boolean;
  manualSession?: ActiveSession;
};

export default function Timer({
  buttonsAlwaysVisible = false,
  className = "",
  manualSession,
}: TimerProps) {
  const {
    elapsedTime,
    isRunning,
    startTimer,
    pauseTimer,
    totalDuration,
    alarmFired,
    setActiveSession,
    activeSession,
  } = useTimerStore();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (buttonsAlwaysVisible && !activeSession && manualSession) {
      setActiveSession(manualSession);
    }

    startTimer(totalDuration);
  };

  const handlePause = () => {
    pauseTimer();
  };

  return (
    <div
      className={`${russoOne.className} flex items-center justify-center gap-2 ${className}`}
    >
      <span className="text-center font-mono font-bold">
        {formatTime(elapsedTime)}
      </span>
      {(buttonsAlwaysVisible ||
        !(alarmFired || (totalDuration > 0 && elapsedTime >= totalDuration))) &&
        (isRunning ? (
          <button aria-label="Pause timer" onClick={handlePause}>
            <CirclePause />
          </button>
        ) : (
          <button aria-label="Start timer" onClick={handleStart}>
            <CirclePlay />
          </button>
        ))}
    </div>
  );
}
