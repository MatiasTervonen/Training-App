"use client";

import { useState, useEffect } from "react";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import DeleteSessionBtn from "@/app/(app)/components/buttons/deleteSessionBtn";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import DateTimePicker from "@/app/(app)/components/DateTimePicker";
import InfoModal from "@/app/(app)/components/InfoModal";
import LinkButton from "@/app/(app)/components/buttons/LinkButton";
import SubNotesInput from "@/app/(app)/ui/SubNotesInput";
import TitleInput from "@/app/(app)/ui/TitleInput";
import useDraft from "@/app/(app)/reminders/hooks/useDraft";
import useSaveReminder from "@/app/(app)/reminders/hooks/useSaveReminder";
import { Info } from "lucide-react";

export default function GlobalReminder() {
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
          <p className="text-lg text-center">Add your reminders here</p>
          <div className="flex items-center justify-center gap-2">
            <Info color="#9ca3af" size={18} />
            <p className="text-gray-400 text-sm">
              Notifies all logged-in devices.
            </p>
          </div>
          <div className="w-full">
            <TitleInput
              value={title}
              setValue={setTitle}
              placeholder="Reminder title... (required)"
              label="Title..."
            />
          </div>
          <div className="z-50 w-full">
            <DateTimePicker
              value={notifyAt}
              onChange={setNotifyAt}
              label="Notify at:"
              placeholder="Select date and time (required)"
            />
          </div>
          <SubNotesInput
            notes={notes}
            setNotes={setNotes}
            placeholder="Write your notes here... (optional)"
            label="Notes..."
          />
        </div>
        <div className="flex flex-col gap-5">
          <SaveButton onClick={saveReminder} />
          <DeleteSessionBtn onDelete={resetReminder} />
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving reminder..." />}

      <InfoModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="p-6 items-center text-center">
          <h2 className="text-xl mb-4">Push Notifications Disabled</h2>
          <p className="mb-10 text-gray-300 text-lg">
            Enable push notifications from menu to receive reminders.
          </p>
          <div className="flex gap-3">
            <LinkButton href="/sessions">Back</LinkButton>
            <LinkButton href="/menu">Menu</LinkButton>
          </div>
        </div>
      </InfoModal>
    </>
  );
}
