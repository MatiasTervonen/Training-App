"use client";

import { useRouter } from "next/navigation";
import { TemplateSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import Modal from "@/app/(app)/components/modal";
import { useState } from "react";
import toast from "react-hot-toast";
import TimerCard from "../components/TimerCard";
import { useTimerStore } from "@/app/(app)/lib/stores/timerStore";
import { timers } from "@/app/(app)/types/models";
import { deleteTimer } from "@/app/(app)/database/timer/delete-timer";
import { getTimers } from "@/app/(app)/database/timer/get-timers";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import TitleInput from "@/app/(app)/ui/TitleInput";
import SubNotesInput from "@/app/(app)/ui/SubNotesInput";
import SetInput from "@/app/(app)/gym/components/SetInput";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import useUpdateTimer from "../hooks/useUpdateTimer";

export default function TimersPage() {
  const { t } = useTranslation(["timer", "common"]);
  const [expandedItem, setExpandedItem] = useState<timers | null>(null);
  const [editingItem, setEditingItem] = useState<timers | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editSeconds, setEditSeconds] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  const queryClient = useQueryClient();

  const {
    data: timer = [],
    error,
    isLoading,
  } = useQuery<timers[]>({
    queryKey: ["get-timers"],
    queryFn: getTimers,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { startTimer, setActiveSession } = useTimerStore();

  const activeSession = useTimerStore((state) => state.activeSession);

  const openEditModal = (timer: timers) => {
    const minutes = Math.floor(timer.time_seconds / 60);
    const seconds = timer.time_seconds % 60;

    setEditTitle(timer.title);
    setEditNotes(timer.notes || "");
    setEditMinutes(String(minutes));
    setEditSeconds(String(seconds));
    setEditingItem(timer);
    setExpandedItem(null);
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditTitle("");
    setEditNotes("");
    setEditMinutes("");
    setEditSeconds("");
  };

  const hasUnsavedChanges = editingItem
    ? editTitle !== editingItem.title ||
      editNotes !== (editingItem.notes || "") ||
      editMinutes !== String(Math.floor(editingItem.time_seconds / 60)) ||
      editSeconds !== String(editingItem.time_seconds % 60)
    : false;

  const { handleUpdateTimer } = useUpdateTimer({
    id: editingItem?.id || "",
    title: editTitle,
    notes: editNotes,
    setIsSaving,
    alarmMinutes: editMinutes,
    alarmSeconds: editSeconds,
    onSuccess: closeEditModal,
  });

  const handleDeleteTimer = async (timerId: string) => {
    const queryKey = ["get-timers"];

    await queryClient.cancelQueries({ queryKey });

    const previousTimers = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<timers[]>(queryKey, (oldData) => {
      if (!oldData) return;

      return oldData.filter((t) => t.id !== timerId);
    });

    try {
      await deleteTimer(timerId);

      toast.success(t("timer.deleteSuccess"));
    } catch {
      queryClient.setQueryData(queryKey, previousTimers);
      toast.error(t("timer.deleteError"));
    }
  };

  const startSavedTimer = (timer: timers) => {
    if (activeSession) {
      toast.error(
        `${t("timer.activeSessionError")} ${t("timer.activeSessionErrorSub")}`
      );
      return;
    }

    localStorage.setItem(
      "timer_session_draft",
      JSON.stringify({
        title: timer.title,
        notes: timer.notes,
        durationInSeconds: timer.time_seconds,
      })
    );

    setActiveSession({
      type: "timer",
      label: timer.title,
      path: "/timer/empty-timer",
    });

    startTimer(timer.time_seconds);
    router.push("/timer/empty-timer");
  };

  return (
    <div className="flex flex-col max-w-md mx-auto page-padding">
      <h1 className="text-center text-2xl mb-10">{t("timer.myTimers")}</h1>

      {!error && isLoading && <TemplateSkeleton count={3} />}

      {error && (
        <p className="text-red-500 text-center">
          {t("timer.errorLoadingTimers")}
        </p>
      )}

      {!isLoading && timer.length === 0 && (
        <p className="text-gray-300 text-center">
          {t("timer.noTimers")}
        </p>
      )}

      {timer &&
        timer.map((timer: timers) => (
          <div
            key={timer.id}
            onClick={() => setExpandedItem(timer)}
            className="text-center bg-blue-800 py-2 my-3 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:scale-105 transition-all duration-200"
          >
            {timer.title}
          </div>
        ))}

      {expandedItem && (
        <Modal isOpen={true} onClose={() => setExpandedItem(null)}>
          <TimerCard
            item={expandedItem}
            onDelete={() => {
              handleDeleteTimer(expandedItem.id);
              setExpandedItem(null);
            }}
            onEdit={() => openEditModal(expandedItem)}
            onStarTimer={() => startSavedTimer(expandedItem)}
          />
        </Modal>
      )}

      {editingItem && (
        <Modal isOpen={true} onClose={closeEditModal} confirmBeforeClose={hasUnsavedChanges}>
          <div className="min-h-full max-w-md mx-auto flex flex-col justify-between page-padding">
            <div className="flex flex-col gap-5">
              <h1 className="text-2xl text-center mb-5">
                {t("timer.editTimer")}
              </h1>
              <TitleInput
                value={editTitle}
                setValue={setEditTitle}
                placeholder={t("timer.enterTimerTitle")}
                label={t("timer.titlePlaceholder")}
                maxLength={150}
              />
              <SubNotesInput
                placeholder={t("timer.enterNotesOptional")}
                label={t("timer.notesLabel")}
                notes={editNotes}
                setNotes={setEditNotes}
              />
              <div className="flex items-center justify-center gap-4">
                <div>
                  <SetInput
                    label={t("timer.minutes")}
                    placeholder={`0 ${t("timer.minAbbr")}`}
                    value={editMinutes}
                    type="number"
                    onChange={(e) => setEditMinutes(e.target.value)}
                  />
                </div>
                <div>
                  <SetInput
                    label={t("timer.seconds")}
                    placeholder={`0 ${t("timer.secAbbr")}`}
                    value={editSeconds}
                    type="number"
                    onChange={(e) => setEditSeconds(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-5 mt-10">
              <SaveButton
                onClick={handleUpdateTimer}
                label={t("timer.update")}
              />
              <button
                onClick={closeEditModal}
                className="w-full bg-gray-700 py-2 rounded-md shadow-md border-2 border-gray-500 text-lg cursor-pointer hover:bg-gray-600 hover:scale-105 transition-all duration-200"
              >
                {t("common:common.cancel")}
              </button>
            </div>
            {isSaving && <FullScreenLoader message={t("timer.updatingTimer")} />}
          </div>
        </Modal>
      )}
    </div>
  );
}
