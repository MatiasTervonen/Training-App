"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/(app)/ui/save-button";
import DeleteSessionBtn from "@/app/(app)/ui/deleteSessionBtn";
import NotesInput from "@/app/(app)/ui/NotesInput";
import CustomInput from "@/app/(app)/ui/CustomInput";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { useDebouncedCallback } from "use-debounce";
import { updateFeed } from "@/app/(app)/lib/revalidateFeed";
import DateTimePicker from "@/app/(app)/components/DateTimePicker";
import { handleError } from "../utils/handleError";
import InfoModal from "../components/InfoModal";
import LinkButton from "../ui/LinkButton";
import { saveReminderToDB } from "../database/reminder";

export default function Notes() {
  const draft =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("reminder_draft") || "null")
      : null;

  const [notes, setNotes] = useState(draft?.notes || "");
  const [title, setValue] = useState(draft?.title || "");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

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

    setIsSaving(true);

    try {
      await saveReminderToDB({
        title: title,
        notes,
        type: "global",
        notify_at: notifyAt.toISOString(),
      });

      updateFeed();
      router.push("/dashboard");
      resetReminder();
    } catch (error) {
      console.log("Error saving reminder:", error);
      handleError(error, {
        message: "Error saving reminders",
        route: "/api/reminders/save-reminders",
        method: "POST",
      });
      toast.error("Failed to save reminder. Please try again.");
      setIsSaving(false);
    }
  };

  const saveDraft = useDebouncedCallback(() => {
    if (notes.trim().length === 0 && title.trim().length === 0) {
      localStorage.removeItem("reminder_draft");
    } else {
      const sessionDraft = {
        title: title,
        notes,
      };
      localStorage.setItem("reminder_draft", JSON.stringify(sessionDraft));
    }
  }, 500); 

  useEffect(() => {
    saveDraft();
  }, [notes, title, saveDraft]);

  const resetReminder = () => {
    localStorage.removeItem("reminder_draft");
    setValue("");
    setNotes("");
    setNotifyAt(null);
  };

  return (
    <>
      <div className="flex flex-col h-full w-full px-6 max-w-md mx-auto">
        <div className="flex flex-col items-center mt-5 gap-5 grow mb-10 h-full">
          <p className="text-lg text-center">Add your reminders here</p>
          <div className="w-full">
            <CustomInput
              value={title}
              setValue={setValue}
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
          <div className="flex w-full grow z-0">
            <NotesInput
              notes={notes}
              setNotes={setNotes}
              placeholder="Write your notes here... (optional)"
              label="Notes..."
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-5 mb-10  self-center w-full">
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
