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
import { startTimer } from "../utils/StartTimer";

export default function TimerPage() {
  const [timerTitle, setTimerTitle] = useState("");
  const [hasLoadedDraft, sethasLaoding] = useState(false);
  const [alarmMinutes, setAlarmMinutes] = useState("");
  const [alarmSeconds, setAlarmSeconds] = useState("");
  const [notes, setNotes] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const router = useRouter();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleReset = () => {
    localStorage.removeItem("activeSession");
    localStorage.removeItem("timer:timer");
    localStorage.removeItem("timer:isRunning");
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
      localStorage.removeItem("activeSession");
      localStorage.removeItem("timer:timer");
      localStorage.removeItem("timer:isRunning");
      setTimerTitle("");
      setAlarmMinutes("");
      setAlarmSeconds("");
      setNotes("");
      setIsRunning(false);
      setTotalDuration(0);
      setElapsedTime(0);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    }, 50);
  };

  const handleStartTimer = () => {
    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;

    if (minutes === 0 && seconds === 0) {
      alert("Please enter at least minutes or seconds.");
      return;
    }

    const totalSeconds = minutes * 60 + seconds;
    setTotalDuration(totalSeconds);
    setElapsedTime(0);

    startTimer(timerTitle, notes, totalSeconds);

    setIsRunning(true);
  };

  const restartTimer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    handleStartTimer();
  };

  useEffect(() => {
    const existingSession = localStorage.getItem("activeSession");
    if (existingSession) {
      try {
        const session = JSON.parse(existingSession);
        if (session.type === "timer") {
          session.label = timerTitle;
          localStorage.setItem("activeSession", JSON.stringify(session));
        }
      } catch (error) {
        console.error("Failed to parse active session:", error);
      }
    }
  }, [timerTitle]);

  useEffect(() => {
    if (!hasLoadedDraft) return;

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
  }, [timerTitle, alarmMinutes, alarmSeconds, notes, hasLoadedDraft]);

  useEffect(() => {
    const draft = localStorage.getItem("timer_session_draft");
    if (draft) {
      try {
        const {
          title: savedTitle,
          notes,
          durationInSeconds,
        } = JSON.parse(draft);
        if (savedTitle) {
          setTimerTitle(savedTitle);
        }
        if (notes) {
          setNotes(notes);
        }
        if (typeof durationInSeconds === "number") {
          setAlarmMinutes(Math.floor(durationInSeconds / 60).toString());
          setAlarmSeconds((durationInSeconds % 60).toString());
          setTotalDuration(durationInSeconds);
        }
      } catch (error) {
        console.error("Failed to parse timer session draft:", error);
      }
    }

    const runningStatus = localStorage.getItem("timer:isRunning");
    if (runningStatus === "true") {
      setIsRunning(true);
    }

    sethasLaoding(true);
  }, []);

  useEffect(() => {
    if (isRunning && elapsedTime >= totalDuration) {
      localStorage.removeItem("timer:isRunning");
      localStorage.removeItem("timer:timer");
      playAlarm();
    }
  }, [elapsedTime, totalDuration, isRunning]);

  const playAlarm = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/timer-audio/mixkit-classic-alarm-995.wav");
      audioRef.current.loop = true;
    }
    audioRef.current.play();
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <ModalPageWrapper
      noTopPadding
      onSwipeRight={() => router.back()}
      leftLabel="back"
      onSwipeLeft={() => router.push("/dashboard")}
      rightLabel="home"
    >
      <div
        onClick={stopAlarm}
        className={`${russoOne.className} p-5 h-full relative text-gray-100 `}
      >
        {isRunning ? (
          <>
            <div className="flex items-center justify-center mb-5 text-xl">
              <h1>{timerTitle}</h1>
            </div>
            <p className="text-center text-sm text-gray-300 mt-2">
              {Math.floor(totalDuration / 60)} min {totalDuration % 60} sec
            </p>
            <div>
              <Timer
                sessionId="timer"
                onElapsedChange={(elapsed) => setElapsedTime(elapsed)}
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
