"use client";

import { russoOne } from "@/app/ui/fonts";
import ModalPageWrapper from "@/app/(app)//components/modalPageWrapper";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import TitleInput from "@/app/(app)/training/components/TitleInput";
import SetInput from "@/app/(app)/training/components/SetInput";
import NotesInput from "../../training/components/NotesInput";
import Timer from "../../components/timer";
import { CircleX, RotateCcw } from "lucide-react";
import { useTimerStore } from "../../lib/stores/timerStore";

export default function TimerPage() {
  const draft =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("timer_session_draft") || "null")
      : null;

  const [timerTitle, setTimerTitle] = useState(draft?.title || "");
  const [alarmMinutes, setAlarmMinutes] = useState(
    draft ? Math.floor(draft.durationInSeconds / 60).toString() : ""
  );
  const [alarmSeconds, setAlarmSeconds] = useState(
    draft ? (draft.durationInSeconds % 60).toString() : ""
  );
  const [notes, setNotes] = useState(draft?.notes || "");

  const router = useRouter();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    totalDuration,
    elapsedTime,
    alarmFired,
    setAlarmFired,
    setActiveSession,
    stopTimer,
    startTimer,
  } = useTimerStore();

  const handleReset = () => {
    setActiveSession(null);
    stopTimer();
    setTimerTitle("");
    setAlarmMinutes("");
    setAlarmSeconds("");
    setNotes("");
  };

  const cancelTimer = () => {
    const confirmCancel = confirm(
      "Are you sure you want to cancel the timer? This will reset all fields."
    );
    if (!confirmCancel) return;

    router.replace("/timer/empty-timer");

    setTimeout(() => {
      const { setActiveSession, stopTimer } = useTimerStore.getState();

      setActiveSession(null);
      stopTimer();
      setTimerTitle("");
      setAlarmMinutes("");
      setAlarmSeconds("");
      setNotes("");

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
      label: timerTitle,
      path: "/timer/empty-timer",
    });

    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;

    if (minutes === 0 && seconds === 0) {
      alert("Please enter at least minutes or seconds.");
      return;
    }

    const totalSeconds = minutes * 60 + seconds;

    startTimer(totalSeconds);
  };

  const restartTimer = () => {
    stopTimer();
    handleStartTimer();
  };

  useEffect(() => {
    if (
      timerTitle.trim() === "" &&
      alarmMinutes.trim() === "" &&
      alarmSeconds.trim() === ""
    ) {
      localStorage.removeItem("timer_session_draft");
      return;
    }

    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;
    const totalSeconds = minutes * 60 + seconds;

    const sessionDraft = {
      title: timerTitle,
      notes: notes,
      durationInSeconds: totalSeconds,
    };
    localStorage.setItem("timer_session_draft", JSON.stringify(sessionDraft));
  }, [timerTitle, alarmMinutes, alarmSeconds, notes]);

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
    setAlarmFired(false);
  };

  const showTimerUI = totalDuration > 0;

  return (
    <ModalPageWrapper
      noTopPadding
      onSwipeRight={() => router.back()}
      leftLabel="back"
      onSwipeLeft={() => router.push("/dashboard")}
      rightLabel="home"
    >
      <div
        onClick={() => {
          if (alarmFired) {
            stopAlarm();
          }
        }}
        className={`${russoOne.className} p-5 h-full relative text-gray-100 `}
      >
        {showTimerUI ? (
          <>
            <div className="flex items-center justify-center mb-5 text-xl">
              <h1>{timerTitle}</h1>
            </div>
            <p className="text-center text-sm text-gray-300 mt-2">
              {Math.floor(totalDuration / 60)} min {totalDuration % 60} sec
            </p>
            <div>
              <Timer
                className={`text-8xl flex-col ${
                  elapsedTime >= totalDuration
                    ? "animate-pulse text-red-500"
                    : ""
                }`}
              />
            </div>
            <div className="text-center text-gray-300 mt-5">{notes}</div>
            <div className="w-full bg-gray-200 h-5 rounded-full overflow-hidden mt-5">
              <div
                className="h-full bg-green-500 transition-all duration-100 ease-in-out"
                style={{ width: `${(elapsedTime / totalDuration) * 100}%` }}
              ></div>
            </div>
            {elapsedTime >= totalDuration && (
              <div className="flex items-center justify-center mt-10 max-w-md mx-auto gap-2">
                <button
                  className="bg-red-600 border-2 border-red-400 py-2 px-4 shadow-xl rounded-md cursor-pointer hover:scale-95 hover:bg-red-500"
                  onClick={stopAlarm}
                >
                  Stop alarm
                </button>

                <button
                  onClick={restartTimer}
                  className="flex items-center gap-2 bg-blue-800 py-2 border-2 border-blue-500 rounded-md px-4 cursor-pointer hover:scale-95 hover:bg-blue-700"
                >
                  <p>Restart</p>
                  <RotateCcw />
                </button>
              </div>
            )}
            <button>
              <CircleX
                className="absolute top-5 right-5 text-gray-300 hover:text-red-500"
                size={24}
                onClick={cancelTimer}
              />
            </button>
          </>
        ) : (
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl text-center my-5">Timer</h1>
            <div className="mb-5">
              <TitleInput
                title={timerTitle}
                setTitle={setTimerTitle}
                placeholder="Timer title (optional)"
                label="Timer Title"
              />
            </div>
            <div className="mb-5">
              <NotesInput
                placeholder="Notes (optional)"
                label="Notes"
                notes={notes}
                setNotes={setNotes}
              />
            </div>
            <div className="flex items-center justify-center gap-4 mb-5">
              <div>
                <SetInput
                  label="Minutes"
                  placeholder="0 min"
                  value={alarmMinutes}
                  type="number"
                  onChange={(value) => setAlarmMinutes(value)}
                />
              </div>
              <div>
                <SetInput
                  label="Seconds"
                  placeholder="0 sec"
                  value={alarmSeconds}
                  type="number"
                  onChange={(value) => setAlarmSeconds(value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-5 items-center justify-center mb-5 mt-10">
              <button
                onClick={handleStartTimer}
                className={`${russoOne.className}  flex items-center justify-center w-full gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
              >
                Start Timer
              </button>
              <button
                className="w-full bg-red-600 border-2 border-red-400 py-2 shadow-xl rounded-md cursor-pointer hover:scale-95 hover:bg-red-500"
                onClick={handleReset}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalPageWrapper>
  );
}
