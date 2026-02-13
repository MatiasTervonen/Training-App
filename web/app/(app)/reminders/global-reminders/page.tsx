"use client";

import { useState, useEffect } from "react";
import SaveButton from "@/components/buttons/save-button";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import FullScreenLoader from "@/components/FullScreenLoader";
import DateTimePicker from "@/components/DateTimePicker";
import InfoModal from "@/components/InfoModal";
import LinkButton from "@/components/buttons/LinkButton";
import SubNotesInput from "@/ui/SubNotesInput";
import TitleInput from "@/ui/TitleInput";
import useDraft from "@/features/reminders/hooks/useDraft";
import useSaveReminder from "@/features/reminders/hooks/useSaveReminder";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function GlobalReminder() {
  const { t } = useTranslation("reminders");
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const resetReminder = () => {
    localStorage.removeItem("reminder_draft");
    setTitle("");
    setNotes("");
    setNotifyAt(null);
  };

  // useDraft hook to save draft
  useDraft({
    title,
    notes,
    setTitle,
    setNotes,
    setIsLoaded,
    isLoaded,
  });

  // Check for push notification subscription

  useEffect(() => {
    async function checkSubscription() {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();

        if (!sub) {
          setIsOpen(true);
        }
      }
    }

    checkSubscription();
  }, []);

  // useSaveReminder hook to save reminder
  const { saveReminder } = useSaveReminder({
    title,
    notes,
    notifyAt: notifyAt!,
    setIsSaving,
    resetReminder,
  });

  return (
    <>
      <div className="page-padding flex flex-col h-full w-full max-w-md mx-auto">
        <div className="flex flex-col items-center gap-5 grow h-full">
          <p className="text-lg text-center">
            {t("reminders.addRemindersHere")}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Info color="#9ca3af" size={18} />
            <p className="text-gray-400 text-sm">
              {t("reminders.notifiesAllDevices")}
            </p>
          </div>
          <div className="w-full">
            <TitleInput
              value={title}
              setValue={setTitle}
              placeholder={t("reminders.titlePlaceholder")}
              label={t("reminders.titleLabel")}
            />
          </div>
          <div className="z-50 w-full">
            <DateTimePicker
              value={notifyAt}
              onChange={setNotifyAt}
              label={t("reminders.notifyAtLabel")}
              placeholder={t("reminders.selectDateTimePlaceholder")}
            />
          </div>
          <SubNotesInput
            notes={notes}
            setNotes={setNotes}
            placeholder={t("reminders.notesPlaceholder")}
            label={t("reminders.notesLabel")}
          />
        </div>
        <div className="flex flex-col gap-5">
          <SaveButton onClick={saveReminder} />
          <DeleteSessionBtn onDelete={resetReminder} />
        </div>
      </div>
      {isSaving && <FullScreenLoader message={t("reminders.savingReminder")} />}

      <InfoModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="p-6 items-center text-center">
          <h2 className="text-xl mb-4">{t("reminders.pushDisabledTitle")}</h2>
          <p className="mb-10 text-gray-300 text-lg">
            {t("reminders.pushDisabledMessage")}
          </p>
          <div className="flex gap-3">
            <LinkButton href="/sessions">{t("reminders.back")}</LinkButton>
            <LinkButton href="/menu/settings">{t("reminders.menu")}</LinkButton>
          </div>
        </div>
      </InfoModal>
    </>
  );
}
