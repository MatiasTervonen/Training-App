"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import CustomInput from "@/app/(app)/ui/CustomInput";
import SetInput from "@/app/(app)/training/components/SetInput";
import SaveButton from "../../ui/save-button";
import toast from "react-hot-toast";
import FullScreenLoader from "../../components/FullScreenLoader";
import NotesInput from "../../ui/NotesInput";
import { mutate } from "swr";
import { handleError } from "@/app/(app)/utils/handleError";
import DeleteSessionBtn from "../../ui/deleteSessionBtn";
import { saveTimerToDB } from "../../database/timer";
import { fetcher } from "../../lib/fetcher";

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
    } catch (error) {
      handleError(error, {
        message: "Error saving timer",
        route: "/api/timer/save-timer",
        method: "POST",
      });
      toast.error("Failed to save timer. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 h-full relative  max-w-md mx-auto flex flex-col justify-between">
      <div>
        <h1 className="text-2xl text-center my-5 ">Create Timer</h1>
        <div className="mb-5">
          <CustomInput
            value={timerTitle}
            setValue={setTimerTitle}
            placeholder="Enter timer title"
            label="Timer Title"
          />
        </div>
        <div className="mb-5">
          <NotesInput
            placeholder="Enter notes (optional)"
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
      </div>
      <div className="flex flex-col gap-5 items-center justify-center mb-10 mt-10">
        <SaveButton onClick={saveTimer} label="Save Timer" />
        <DeleteSessionBtn onDelete={handleReset} label="Delete" />
      </div>
      {isSaving && <FullScreenLoader message="Saving Timer..." />}
    </div>
  );
}
