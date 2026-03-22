"use client";

import { CirclePlay, CirclePause, RotateCcw } from "lucide-react";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";


type TimerProps = {
  className?: string;
  onStopAlarmSound?: () => void;
  alarmStyle?: boolean;
};

export default function Timer({
  className = "",
  onStopAlarmSound,
  alarmStyle = false,
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
  const { t } = useTranslation("timer");

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
    const total = Math.round(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
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
      className={`flex items-center  w-full h-full gap-2 ${className}`}
    >
      <p
        ref={textRef}
        className={`text-center font-mono font-bold leading-none ${alarmStyle ? "text-red-500" : ""}`}
        style={{
          fontSize: `${fontSize}px`,
          whiteSpace: "nowrap",
        }}
      >
        {formatTime(Math.max(0, totalDuration - elapsedTime))}
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
              aria-label={t("timer.notification.stopAlarm")}
              onClick={() => {
                onStopAlarmSound?.();
              }}
              className="btn-danger w-40 text-center"
            >
              {t("timer.notification.stopAlarm")}
            </button>

            <button
              aria-label={t("timer.notification.restart")}
              onClick={() => {
                stopTimer();
                startTimer(totalDuration);

                setActiveSession({
                  type: t("timer.title"),
                  label: t("timer.title"),
                  path: "/timer/empty-timer",
                });
              }}
              className="btn-base w-40 flex gap-2 items-center justify-center"
            >
              <p>{t("timer.notification.restart")}</p>
              <RotateCcw size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
