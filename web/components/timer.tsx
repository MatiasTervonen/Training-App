"use client";

import { CirclePlay, CirclePause } from "lucide-react";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
};

type TimerProps = {
  className?: string;
  manualSession?: ActiveSession;
};

export default function Timer({ className = "", manualSession }: TimerProps) {
  const {
    elapsedTime,
    isRunning,
    startTimer,
    pauseTimer,
    totalDuration,
    setActiveSession,
    activeSession,
    resumeTimer,
    startTimestamp,
    alarmFired,
  } = useTimerStore();

  useEffect(() => {
    const { isRunning, startTimestamp } = useTimerStore.getState();

    if (isRunning && startTimestamp) {
      resumeTimer();
    }
  }, [resumeTimer]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const { isRunning, startTimestamp } = useTimerStore.getState();
        if (isRunning && startTimestamp) {
          resumeTimer();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resumeTimer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!activeSession && manualSession) {
      setActiveSession(manualSession);
    }

    const isPaused = !isRunning && elapsedTime > 0 && startTimestamp === null;

    if (isPaused) {
      resumeTimer();
    } else {
      startTimer(totalDuration);
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <p className="font-mono font-bold leading-none text-lg">
        {formatTime(elapsedTime)}
      </p>
      {!alarmFired &&
        (isRunning ? (
          <button
            className="hover:scale-105 transition-transform duration-200"
            aria-label="Pause timer"
            onClick={handlePause}
          >
            <CirclePause size={20} />
          </button>
        ) : (
          <button
            className="hover:scale-105 transition-transform duration-200"
            aria-label="Start timer"
            onClick={handleStart}
          >
            <CirclePlay size={20} />
          </button>
        ))}
    </div>
  );
}
