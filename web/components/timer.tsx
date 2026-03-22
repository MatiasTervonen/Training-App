"use client";

import { CirclePlay, CirclePause } from "lucide-react";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect } from "react";
import { formatDurationLong } from "@/lib/formatDate";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
};

type TimerProps = {
  className?: string;
  textClassName?: string;
  manualSession?: ActiveSession;
};

export default function Timer({
  className = "",
  textClassName = "",
  manualSession,
}: TimerProps) {
  const {
    elapsedTime,
    isRunning,
    startTimer,
    startSession,
    pauseTimer,
    totalDuration,
    setActiveSession,
    activeSession,
    resumeTimer,
    startTimestamp,
    alarmFired,
    mode,
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

  const handleStart = () => {
    if (!activeSession && manualSession) {
      setActiveSession(manualSession);
    }

    const isPaused = !isRunning && elapsedTime > 0 && startTimestamp === null;

    if (isPaused) {
      resumeTimer();
    } else if (mode === "countdown" || totalDuration > 0) {
      startTimer(totalDuration);
    } else {
      startSession();
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const displaySeconds =
    mode === "countdown"
      ? Math.max(0, totalDuration - elapsedTime)
      : elapsedTime;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <p className={`font-mono font-bold leading-none text-lg ${textClassName}`}>
        {formatDurationLong(displaySeconds)}
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
