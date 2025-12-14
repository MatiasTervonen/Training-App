"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import DeleteSessionBtn from "@/app/(app)/components/buttons/deleteSessionBtn";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { useDebouncedCallback } from "use-debounce";
import DateTimePicker from "@/app/(app)/components/DateTimePicker";
import InfoModal from "@/app/(app)/components/InfoModal";
import LinkButton from "@/app/(app)/components/buttons/LinkButton";
import { saveReminderToDB } from "@/app/(app)/database/reminder";
import SubNotesInput from "@/app/(app)/ui/SubNotesInput";
import TitleInput from "@/app/(app)/ui/TitleInput";
import { useQueryClient } from "@tanstack/react-query";

export default function GlobalReminder() {
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const draft = localStorage.getItem("reminder_draft");
    if (draft) {
      const { title: savedTitle, notes: savedNotes } = JSON.parse(draft);
      if (savedTitle) setTitle(savedTitle);
      if (savedNotes) setNotes(savedNotes);
    }
    setIsLoaded(true);
  }, []);

  const saveDraft = useDebouncedCallback(
    () => {
      if (!isLoaded) return;

      if (notes.trim().length === 0 && title.trim().length === 0) {
        localStorage.removeItem("reminder_draft");
      } else {
        const sessionDraft = {
          title: title,
          notes,
        };
        localStorage.setItem("reminder_draft", JSON.stringify(sessionDraft));
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    saveDraft();
  }, [notes, title, saveDraft]);

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

  const saveReminder = async () => {
    if (title.trim().length === 0) {
      toast.error("Title is required");
      return;
    }
    if (!notifyAt) {
      toast.error("Notify time is required");
      return;
    }

    if (notifyAt < new Date()) {
      toast.error("Notify time must be in the future.");
      return;
    }

    setIsSaving(true);

    try {
      await saveReminderToDB({
        title: title,
        notes,
        type: "global",
        notify_at: notifyAt.toISOString(),
      });

      await queryClient.refetchQueries({
        queryKey: ["get-reminders"],
        exact: true,
      });
      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      router.push("/dashboard");
      resetReminder();
    } catch {
      toast.error("Failed to save reminder. Please try again.");
      setIsSaving(false);
    }
  };

  const resetReminder = () => {
    localStorage.removeItem("reminder_draft");
    setTitle("");
    setNotes("");
    setNotifyAt(null);
  };

  return (
    <>
      <div className="page-padding flex flex-col h-full w-full max-w-md mx-auto">
        <div className="flex flex-col items-center gap-5 grow h-full">
          <p className="text-lg text-center mb-5">Add your reminders here</p>
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
