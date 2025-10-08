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
      const response = await fetch("/api/timer/save-timer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: timerTitle,
          notes: notes,
          durationInSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save timer");
      }

      await response.json();

      mutate("/api/timer/get-timer", undefined, { revalidate: true });

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
    <div className="p-5 h-full relative text-gray-100 max-w-md mx-auto">
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
      <div className="flex flex-col gap-5 items-center justify-center mb-5 mt-10">
        <SaveButton onClick={saveTimer} label="Save Timer" />
        <button
          className="w-full bg-red-600 border-2 border-red-400 py-2 shadow-xl rounded-md cursor-pointer hover:scale-95 hover:bg-red-500"
          onClick={handleReset}
        >
          Cancel
        </button>
      </div>
      {isSaving && <FullScreenLoader message="Saving Timer..." />}
    </div>
  );
}
