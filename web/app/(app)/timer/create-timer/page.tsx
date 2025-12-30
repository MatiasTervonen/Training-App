"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SetInput from "@/app/(app)/gym/components/SetInput";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import toast from "react-hot-toast";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import DeleteSessionBtn from "@/app/(app)/components/buttons/deleteSessionBtn";
import { saveTimer } from "@/app/(app)/database/timer/save-timer";
import SubNotesInput from "@/app/(app)/ui/SubNotesInput";
import TitleInput from "@/app/(app)/ui/TitleInput";
import { useQueryClient } from "@tanstack/react-query";
import useSaveDraft from "@/app/(app)/timer/hooks/useSaveDraft";

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

  const handleSaveTimer = async () => {
    if (!title || !alarmMinutes || !alarmSeconds) {
      alert("Please fill in all fields.");
      return;
    }

    setIsSaving(true);

    const durationInSeconds =
      parseInt(alarmMinutes) * 60 + parseInt(alarmSeconds);

    try {
      await saveTimer({
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
        <SaveButton onClick={handleSaveTimer} label="Save Timer" />
        <DeleteSessionBtn onDelete={handleReset} label="Delete" />
      </div>
      {isSaving && <FullScreenLoader message="Saving Timer..." />}
    </div>
  );
}
