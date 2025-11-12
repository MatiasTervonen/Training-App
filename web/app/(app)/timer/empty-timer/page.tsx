"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import SetInput from "@/app/(app)/training/components/SetInput";
import Timer from "../components/timer";
import { CircleX } from "lucide-react";
import { useTimerStore } from "../../lib/stores/timerStore";
import { AlarmClock } from "lucide-react";

export default function TimerPage() {
  const [alarmMinutes, setAlarmMinutes] = useState("");
  const [alarmSeconds, setAlarmSeconds] = useState("");

  const router = useRouter();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    totalDuration,
    elapsedTime,
    alarmFired,
    setAlarmFired,
    setActiveSession,
    startTimer,
    clearEverything,
  } = useTimerStore();

  const cancelTimer = () => {
    const confirmCancel = confirm(
      "Are you sure you want to cancel the timer? This will reset all fields."
    );
    if (!confirmCancel) return;

    router.replace("/timer");

    setTimeout(() => {
      localStorage.removeItem("timer_session_draft");
      clearEverything();
      setAlarmMinutes("");
      setAlarmSeconds("");

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    }, 50);
  };

  const handleStartTimer = () => {
    setActiveSession({
      type: "timer",
      label: "Timer",
      path: "/timer/empty-timer",
    });

    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;

    if (minutes === 0 && seconds === 0) {
      alert("Please enter at least minutes or seconds.");
      return;
    }

    const totalSeconds = minutes * 60 + seconds;

    setAlarmFired(false);
    startTimer(totalSeconds);
  };

  const playAlarm = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/timer-audio/mixkit-classic-alarm-995.wav");
      audioRef.current.loop = true;
    }
    audioRef.current.play();
  };

  useEffect(() => {
    if (alarmFired) {
      playAlarm();
    }
  }, [alarmFired]);

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const showTimerUI = totalDuration > 0;

  return (
    <div
      onClick={() => {
        if (alarmFired) {
          stopAlarm();
        }
      }}
      className="p-5 h-full relative"
    >
      {showTimerUI ? (
        <>
          <div className="flex flex-col h-full">
            <div>
              <p className="text-center text-xl text-gray-300 mt-2">
                {Math.floor(totalDuration / 60)} min {totalDuration % 60} sec
              </p>

              <Timer
                onStopAlarmSound={stopAlarm}
                className={`flex-col items-center justify-center w-full  ${
                  elapsedTime >= totalDuration
                    ? "animate-pulse text-red-500"
                    : ""
                }`}
              />

              <div className="w-full bg-gray-200 h-5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100 ease-in-out"
                  style={{ width: `${(elapsedTime / totalDuration) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <button>
            <CircleX
              className="absolute top-5 right-5 text-gray-300 hover:text-red-500"
              size={30}
              onClick={cancelTimer}
            />
          </button>
        </>
      ) : (
        <div className="max-w-md mx-auto flex flex-col gap-10 h-full">
          <div className="flex justify-center items-center gap-5 my-5">
            <h1 className="text-2xl text-center">Timer</h1>
            <AlarmClock color="#d1d5db" size={30} />
          </div>
          <div className="flex items-center justify-center gap-4 mb-5">
            <div>
              <SetInput
                label="Minutes"
                placeholder="0 min"
                value={alarmMinutes}
                type="number"
                min={0}
                onChange={(e) => setAlarmMinutes(e.target.value)}
              />
            </div>
            <div>
              <SetInput
                label="Seconds"
                placeholder="0 sec"
                value={alarmSeconds}
                type="number"
                min={0}
                onChange={(e) => setAlarmSeconds(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-5 items-center justify-center mb-5 mt-10">
            <button
              onClick={handleStartTimer}
              className="w-full gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200"
            >
              Start Timer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
