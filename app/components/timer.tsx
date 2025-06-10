"use client";

import { useEffect, useState } from "react";
import { russoOne } from "@/app/ui/fonts";
import { CirclePlay } from "lucide-react";
import { CirclePause } from "lucide-react";

type TimerProps = {
  sessionId: string;
  resetTrigger?: number;
  onManualStart?: () => void;
};

type TimerData = {
  startTime: number | null;
  elapsedBeforePause: number;
  isRunning: boolean;
};

export default function Timer({
  sessionId,
  resetTrigger,
  onManualStart,
}: TimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Keep time synced every second
  useEffect(() => {
    const interval = setInterval(() => {
      const gameFinished = localStorage.getItem("gameFinished");
      if (gameFinished) {
        clearInterval(interval);
        return;
      }

      const data = localStorage.getItem(`timer:${sessionId}`);
      if (!data) return;

      const { startTime, isRunning, elapsedBeforePause } = JSON.parse(data);
      setIsRunning(isRunning);

      if (isRunning && startTime) {
        const secondsPassed = Math.floor((Date.now() - startTime) / 1000);
        setElapsed(secondsPassed + (elapsedBeforePause || 0));
      } else {
        setElapsed(elapsedBeforePause || 0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (resetTrigger !== undefined) {
      // reset elapsed time

      setElapsed(0);
      setIsRunning(false);
      // optionally clear interval or restart logic
    }
  }, [resetTrigger]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const startTimer = () => {
    const now = Date.now();

    const prevData = localStorage.getItem(`timer:${sessionId}`);
    let elapsedBeforePause = 0;

    if (prevData) {
      const parsed: TimerData = JSON.parse(prevData);
      elapsedBeforePause = parsed.elapsedBeforePause || 0;
    }

    const newData: TimerData = {
      startTime: now,
      elapsedBeforePause,
      isRunning: true,
    };

    localStorage.setItem(`timer:${sessionId}`, JSON.stringify(newData));
    setIsRunning(true);

    if (onManualStart) {
      onManualStart();
    }
  };

  const pauseTimer = () => {
    const data = localStorage.getItem(`timer:${sessionId}`);
    if (!data) return;

    const { startTime, elapsedBeforePause } = JSON.parse(data);
    if (!startTime) return;

    const now = Date.now();
    const sessionElapsed = Math.floor((now - startTime) / 1000);
    const totalElapsed = sessionElapsed + (elapsedBeforePause || 0);

    const newData: TimerData = {
      startTime: null,
      elapsedBeforePause: totalElapsed,
      isRunning: false,
    };

    localStorage.setItem(`timer:${sessionId}`, JSON.stringify(newData));
    setIsRunning(false);
    setElapsed(totalElapsed);
  };

  return (
    <div className={`${russoOne.className} flex items-center gap-2`}>
      <span className="min-w-[55px] text-center">{formatTime(elapsed)}</span>
      {isRunning ? (
        <button aria-label="Pause timer" onClick={pauseTimer}>
          <CirclePause />
        </button>
      ) : (
        <button aria-label="Start timer" onClick={startTimer}>
          <CirclePlay />
        </button>
      )}
    </div>
  );
}
