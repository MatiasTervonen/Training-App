"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SetInput from "@/features/gym/components/SetInput";
import SaveButton from "@/components/buttons/save-button";
import toast from "react-hot-toast";
import FullScreenLoader from "@/components/FullScreenLoader";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import { saveTimer } from "@/database/timer/save-timer";
import SubNotesInput from "@/ui/SubNotesInput";
import TitleInput from "@/ui/TitleInput";
import { useQueryClient } from "@tanstack/react-query";
import useSaveDraft from "@/features/timer/hooks/useSaveDraft";
import { useTranslation } from "react-i18next";

export default function TimerPage() {
  const { t } = useTranslation("timer");
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
      alert(t("timer.fillAllFields"));
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
      toast.error(t("timer.saveError"));
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full max-w-md mx-auto flex flex-col justify-between page-padding">
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl text-center mb-5">{t("timer.createTimer")}</h1>
        <TitleInput
          value={title}
          setValue={setTitle}
          placeholder={t("timer.enterTimerTitle")}
          label={t("timer.titlePlaceholder")}
          maxLength={150}
        />
        <SubNotesInput
          placeholder={t("timer.enterNotesOptional")}
          label={t("timer.notesLabel")}
          notes={notes}
          setNotes={setNotes}
        />
        <div className="flex items-center justify-center gap-4">
          <div>
            <SetInput
              label={t("timer.minutes")}
              placeholder={`0 ${t("timer.minAbbr")}`}
              value={alarmMinutes}
              type="number"
              onChange={(e) => setAlarmMinutes(e.target.value)}
            />
          </div>
          <div>
            <SetInput
              label={t("timer.seconds")}
              placeholder={`0 ${t("timer.secAbbr")}`}
              value={alarmSeconds}
              type="number"
              onChange={(e) => setAlarmSeconds(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 mt-10">
        <SaveButton onClick={handleSaveTimer} label={t("timer.saveTimer")} />
        <DeleteSessionBtn onDelete={handleReset} label={t("timer.delete")} />
      </div>
      {isSaving && <FullScreenLoader message={t("timer.savingTimer")} />}
    </div>
  );
}
