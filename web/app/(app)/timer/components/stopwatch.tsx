"use client";

import { CirclePlay, CirclePause, X } from "lucide-react";
import { useTimerStore } from "@/app/(app)/lib/stores/timerStore";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "@/app/(app)/lib/formatDate";

type StopwatchProps = {
  className?: string;
};

export default function Stopwatch({ className = "" }: StopwatchProps) {
  const { t } = useTranslation("timer");
  const router = useRouter();
  const {
    elapsedTime,
    isRunning,
    startSession,
    pauseTimer,
    resumeTimer,
    startTimestamp,
    clearEverything,
    setActiveSession,
    paused,
  } = useTimerStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    if (isRunning && startTimestamp) {
      resumeTimer();
    }
  }, [isRunning, startTimestamp, resumeTimer]);

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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const handleStart = () => {
    setActiveSession({
      type: t("timer.stopwatchTitle"),
      label: `${t("timer.stopwatchTitle")} - ${formatDateShort(new Date())}`,
      path: "/timer/start-stopwatch",
    });

    if (paused) {
      resumeTimer();
    } else {
      startSession();
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleCancel = () => {
    const confirmCancel = confirm(t("timer.cancelTimerMessage"));
    if (!confirmCancel) return;

    clearEverything();
    router.replace("/timer");
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

  const displaySeconds = elapsedTime;

  return (
    <div
      ref={containerRef}
      className={`flex items-center w-full h-full overflow-hidden gap-2 ${className}`}
    >
      <p
        ref={textRef}
        className="text-center font-mono font-bold leading-none"
        style={{
          fontSize: `${fontSize}px`,
          whiteSpace: "nowrap",
        }}
      >
        {formatTime(displaySeconds)}
      </p>

      <div className="flex items-center justify-center gap-5 mt-10">
        <button
          aria-label={t("timer.cancel")}
          onClick={handleCancel}
          className="flex items-center justify-center gap-2 w-36 bg-red-600 border-2 border-red-400 py-2 rounded-md text-gray-100 hover:bg-red-500 hover:scale-105 transition-all duration-200"
        >
          <X size={20} />
          <span>{t("timer.cancel")}</span>
        </button>

        {isRunning ? (
          <button
            aria-label={t("timer.pause")}
            onClick={handlePause}
            className="flex items-center justify-center gap-2 w-36 bg-blue-800 border-2 border-blue-500 py-2 rounded-md text-gray-100 hover:bg-blue-700 hover:scale-105 transition-all duration-200"
          >
            <CirclePause size={20} />
            <span>{t("timer.pause")}</span>
          </button>
        ) : (
          <button
            aria-label={paused ? t("timer.resume") : t("timer.start")}
            onClick={handleStart}
            className="flex items-center justify-center gap-2 w-36 bg-blue-800 border-2 border-blue-500 py-2 rounded-md text-gray-100 hover:bg-blue-700 hover:scale-105 transition-all duration-200"
          >
            <CirclePlay size={20} />
            <span>{paused ? t("timer.resume") : t("timer.start")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
