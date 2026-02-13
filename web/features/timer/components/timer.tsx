"use client";

import { CirclePlay, CirclePause, RotateCcw } from "lucide-react";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect, useRef, useState } from "react";

type TimerProps = {
  className?: string;
  onStopAlarmSound?: () => void;
};

export default function Timer({
  className = "",
  onStopAlarmSound,
}: TimerProps) {
  const {
    elapsedTime,
    isRunning,
    startTimer,
    pauseTimer,
    totalDuration,
    alarmFired,
    resumeTimer,
    startTimestamp,
    stopTimer,
    setActiveSession,
  } = useTimerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    if (isRunning && startTimestamp) {
      resumeTimer();
    }
  }, [resumeTimer, isRunning, startTimestamp]);

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
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const handleStart = () => {
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

  // Auto-scale to parent (width + height)
  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth: cw, clientHeight: ch } = container;

      const textLength = textEl.innerText.length || 1;

      // Calculate font size based on both width & height
      const widthBased = cw / (textLength * 0.6);
      const heightBased = ch * 0.9; // use 90% of height
      const newSize = Math.max(12, Math.min(widthBased, heightBased));
      setFontSize(newSize);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [elapsedTime]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center  w-full h-full overflow-hidden gap-2 ${className}`}
    >
      <p
        ref={textRef}
        className="text-center font-mono font-bold leading-none"
        style={{
          fontSize: `${fontSize}px`,
          whiteSpace: "nowrap",
        }}
      >
        {formatTime(elapsedTime)}
      </p>
      <div className="flex items-center transition-opacity duration-300">
        {!alarmFired ? (
          isRunning ? (
            <button
              aria-label="Pause timer"
              onClick={handlePause}
              className="hover:scale-105 transition-transform duration-200"
            >
              <CirclePause size={40} />
            </button>
          ) : (
            <button
              aria-label="Start timer"
              onClick={handleStart}
              className="hover:scale-105 transition-transform duration-200"
            >
              <CirclePlay size={40} />
            </button>
          )
        ) : (
          <div className="flex items-center gap-5">
            <button
              aria-label="Stop alarm"
              onClick={() => {
                onStopAlarmSound?.();
              }}
              className="min-w-[129px] bg-red-600 border-2 border-red-400 py-2 px-4y rounded-md text-white hover:bg-red-500 hover:scale-105 transition-all duration-200"
            >
              Stop Alarm
            </button>

            <button
              aria-label="Restart timer"
              onClick={() => {
                stopTimer();
                startTimer(totalDuration);
                setActiveSession({
                  type: "timer",
                  label: "Timer",
                  path: "/timer/empty-timer",
                });
              }}
              className="flex gap-2 items-center bg-blue-800 border-2 border-blue-500 py-2 px-4 rounded-md text-white hover:bg-blue-700 hover:scale-105 transition-all duration-200"
            >
              <p>Restart</p>
              <RotateCcw />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
