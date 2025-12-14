"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SetInput from "@/app/(app)/training/components/SetInput";
import SaveButton from "../../components/buttons/save-button";
import toast from "react-hot-toast";
import FullScreenLoader from "../../components/FullScreenLoader";
import DeleteSessionBtn from "../../components/buttons/deleteSessionBtn";
import { saveTimerToDB } from "../../database/timer";
import SubNotesInput from "../../ui/SubNotesInput";
import TitleInput from "../../ui/TitleInput";
import { useQueryClient } from "@tanstack/react-query";
import useSaveDraft from "../hooks/useSaveDraft";

export default function TimerPage() {
  const [title, setTitle] = useState("");
  const [alarmMinutes, setAlarmMinutes] = useState("");
  const [alarmSeconds, setAlarmSeconds] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  const queryClient = useQueryClient();

  const handleReset = () => {
    localStorage.removeItem("timer_session_draft");
    setTitle("");
    setAlarmMinutes("");
    setAlarmSeconds("");
    setNotes("");
  };

  // useSaveDraft hook to save draft timer

  useSaveDraft({
    title,
    notes,
    setTitle,
    setNotes,
    setIsLoaded,
    isLoaded,
    setAlarmMinutes,
    setAlarmSeconds,
    alarmMinutes,
    alarmSeconds,
  });

  const saveTimer = async () => {
    if (!title || !alarmMinutes || !alarmSeconds) {
      alert("Please fill in all fields.");
      return;
    }

    setIsSaving(true);

    const durationInSeconds =
      parseInt(alarmMinutes) * 60 + parseInt(alarmSeconds);

    try {
      await saveTimerToDB({
        title: title,
        notes: notes,
        durationInSeconds,
      });

      await queryClient.refetchQueries({
        queryKey: ["get-timers"],
        exact: true,
      });

      handleReset();
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
          value={title}
          setValue={setTitle}
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
