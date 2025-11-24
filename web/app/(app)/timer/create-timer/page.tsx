"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import SetInput from "@/app/(app)/training/components/SetInput";
import SaveButton from "../../ui/save-button";
import toast from "react-hot-toast";
import FullScreenLoader from "../../components/FullScreenLoader";
import { mutate } from "swr";
import DeleteSessionBtn from "../../ui/deleteSessionBtn";
import { saveTimerToDB } from "../../database/timer";
import { fetcher } from "../../lib/fetcher";
import SubNotesInput from "../../ui/SubNotesInput";
import TitleInput from "../../ui/TitleInput";

export default function TimerPage() {
  const draft =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("timer_session_draft") || "null")
      : null;

  const [timerTitle, setTimerTitle] = useState(draft?.title || "");
  const [alarmMinutes, setAlarmMinutes] = useState(
    draft?.durationInSeconds
      ? Math.floor(draft.durationInSeconds / 60).toString()
      : ""
  );
  const [alarmSeconds, setAlarmSeconds] = useState(
    draft?.durationInSeconds ? (draft.durationInSeconds % 60).toString() : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState(draft?.notes || "");

  const router = useRouter();

  const handleReset = () => {
    localStorage.removeItem("activeSession");
    localStorage.removeItem("timer:timer");
    setTimerTitle("");
    setAlarmMinutes("");
    setAlarmSeconds("");
    setNotes("");
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

  const saveTimer = async () => {
    if (!timerTitle || !alarmMinutes || !alarmSeconds) {
      alert("Please fill in all fields.");
      return;
    }

    setIsSaving(true);

    const durationInSeconds =
      parseInt(alarmMinutes) * 60 + parseInt(alarmSeconds);

    try {
      await saveTimerToDB({
        title: timerTitle,
        notes: notes,
        durationInSeconds,
      });

      await mutate(
        "/api/timer/get-timer",
        async () => fetcher("/api/timer/get-timer"),
        false
      );

      localStorage.removeItem("timer_session_draft");

      router.push("/timer/my-timers");
    } catch {
      toast.error("Failed to save timer. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full max-w-md mx-auto flex flex-col justify-between page-padding">
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl text-center mb-5">Create Timer</h1>
        <TitleInput
          value={timerTitle}
          setValue={setTimerTitle}
          placeholder="Enter timer title"
          label="Timer Title"
          maxLength={150}
        />
        <SubNotesInput
          placeholder="Enter notes (optional)"
          label="Notes"
          notes={notes}
          setNotes={setNotes}
        />
        <div className="flex items-center justify-center gap-4">
          <div>
            <SetInput
              label="Minutes"
              placeholder="0 min"
              value={alarmMinutes}
              type="number"
              onChange={(e) => setAlarmMinutes(e.target.value)}
            />
          </div>
          <div>
            <SetInput
              label="Seconds"
              placeholder="0 sec"
              value={alarmSeconds}
              type="number"
              onChange={(e) => setAlarmSeconds(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 mt-10">
        <SaveButton onClick={saveTimer} label="Save Timer" />
        <DeleteSessionBtn onDelete={handleReset} label="Delete" />
      </div>
      {isSaving && <FullScreenLoader message="Saving Timer..." />}
    </div>
  );
}
