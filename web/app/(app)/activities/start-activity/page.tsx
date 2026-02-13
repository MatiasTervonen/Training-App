"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import Timer from "@/components/timer";
import TitleInput from "@/ui/TitleInput";
import SubNotesInput from "@/ui/SubNotesInput";
import ActivityDropdown from "@/features/activities/components/ActivityDropdown";
import SaveButton from "@/components/buttons/save-button";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useTimerStore } from "@/lib/stores/timerStore";
import { formatDateShort } from "@/lib/formatDate";
import { saveActivitySession } from "@/database/activities/save-activity-session";
import { activities_with_category } from "@/types/models";
import useSaveActivityDraft from "@/features/activities/hooks/useSaveActivityDraft";

export default function StartActivity() {
  const { t } = useTranslation("activities");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [activityName, setActivityName] = useState("");
  const [selectedActivity, setSelectedActivity] =
    useState<activities_with_category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { clearDraft } = useSaveActivityDraft({
    title,
    notes,
    selectedActivity,
    activityName,
    setTitle,
    setNotes,
    setActivityName,
    setSelectedActivity,
    isLoaded,
    setIsLoaded,
  });

  const startTimestamp = useTimerStore((state) => state.startTimestamp);
  const remainingMs = useTimerStore((state) => state.remainingMs);
  const setActiveSession = useTimerStore((state) => state.setActiveSession);
  const startSession = useTimerStore((state) => state.startSession);
  const stopTimer = useTimerStore((state) => state.stopTimer);

  const getActivityName = useCallback(
    (activity: activities_with_category) => {
      if (activity.slug) {
        const translated = t(`activities.activityNames.${activity.slug}`, {
          defaultValue: "",
        });
        if (
          translated &&
          translated !== `activities.activityNames.${activity.slug}`
        ) {
          return translated;
        }
      }
      return activity.name;
    },
    [t],
  );

  const hasSessionStarted = remainingMs !== null || startTimestamp !== null;

  const handleSelectActivity = (activity: activities_with_category) => {
    const translatedName = getActivityName(activity);
    setSelectedActivity(activity);
    setActivityName(translatedName);
    setTitle(`${translatedName} - ${formatDateShort(new Date())}`);
  };

  const handleStartActivity = () => {
    if (!selectedActivity) return;

    setActiveSession({
      label: title,
      path: "/activities/start-activity",
      type: activityName,
    });
    startSession();
  };

  const handleFinishActivity = async () => {
    if (title.trim() === "") {
      toast.error(t("activities.saveSession.titleRequired"));
      return;
    }

    const confirmed = window.confirm(
      t("activities.saveSession.confirmMessage"),
    );
    if (!confirmed) return;

    try {
      setIsSaving(true);

      const { startTimestamp, isRunning, remainingMs, activeSession } =
        useTimerStore.getState();

      const durationInSeconds =
        isRunning && startTimestamp
          ? Math.floor((Date.now() - startTimestamp) / 1000)
          : Math.floor((remainingMs ?? 0) / 1000);

      const start_time = new Date(
        activeSession?.started_at ?? Date.now(),
      ).toISOString();
      const end_time = new Date().toISOString();

      await saveActivitySession({
        title,
        notes,
        duration: durationInSeconds,
        start_time,
        end_time,
        activityId: selectedActivity!.id,
      });

      clearDraft();
      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });

      router.push("/dashboard");
      stopTimer();
    } catch {
      toast.error(t("activities.saveSession.saveError"));
      setIsSaving(false);
    }
  };

  const handleDeleteSession = () => {
    stopTimer();
    clearDraft();
    setTitle("");
    setNotes("");
    setActivityName("");
    setSelectedActivity(null);
  };

  if (!hasSessionStarted) {
    return (
      <div className="page-padding mx-auto flex flex-col h-full overflow-hidden">
        <h1 className="text-2xl text-center shrink-0">
          {t("activities.startActivityScreen.selectActivity")}
        </h1>

        <div className="flex-1 min-h-0">
          <ActivityDropdown
            onSelect={handleSelectActivity}
            selectedActivity={selectedActivity}
          />
        </div>

        <div className="shrink-0 pt-2 pb-2 px-2">
          <button
            onClick={handleStartActivity}
            disabled={!selectedActivity}
            className="w-full bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {t("activities.startActivityScreen.startButton")}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-full mx-auto flex flex-col">
      <div className="flex items-center  bg-gray-600 p-2 px-4 w-full sticky top-0 z-40">
        <Timer
          manualSession={{
            label: title,
            path: "/activities/start-activity",
            type: activityName,
          }}
        />
      </div>

      <div className="page-padding flex flex-col flex-1 justify-between max-w-md mx-auto w-full">
        <div>
          <h2 className="text-2xl text-center mb-5">{activityName}</h2>

          <div className="flex flex-col gap-4">
            <TitleInput
              value={title}
              setValue={setTitle}
              label={t("activities.startActivityScreen.sessionNameLabel")}
              placeholder={t(
                "activities.startActivityScreen.sessionNamePlaceholder",
              )}
            />
            <SubNotesInput
              notes={notes}
              setNotes={setNotes}
              label={t("activities.startActivityScreen.sessionNotesLabel")}
              placeholder={t(
                "activities.startActivityScreen.sessionNotesPlaceholder",
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 mt-10 pb-5">
          <SaveButton
            onClick={handleFinishActivity}
            label={t("activities.startActivityScreen.finishActivity")}
          />
          <DeleteSessionBtn
            onDelete={handleDeleteSession}
            label={t("activities.startActivityScreen.delete")}
          />
        </div>
      </div>

      {isSaving && (
        <FullScreenLoader
          message={t("activities.startActivityScreen.savingSession")}
        />
      )}
    </div>
  );
}
