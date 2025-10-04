"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/(app)/ui/save-button";
import DeleteSessionBtn from "@/app/(app)/ui/deleteSessionBtn";
import NotesInput from "@/app/(app)/training/components/NotesInput";
import TitleInput from "@/app/(app)/training/components/TitleInput";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { useDebouncedCallback } from "use-debounce";
import { updateFeed } from "@/app/(app)/lib/revalidateFeed";
import DateTimePicker from "@/app/(app)/components/DateTimePicker";
import CheckNotifications from "@/app/(app)/lib/CheckNotifications";

export default function Notes() {
  CheckNotifications();

  const draft =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("reminder_draft") || "null")
      : null;

  const [notes, setNotes] = useState(draft?.notes || "");
  const [title, setTitle] = useState(draft?.title || "");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const router = useRouter();

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
      const res = await fetch("/api/reminders/save-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          notes,
          notify_at: notifyAt ? notifyAt.toISOString() : null,
        }),
      });

      if (!res.ok) {
        setIsSaving(false);
        throw new Error("Failed to save notes");
      }

      await res.json();

      updateFeed();
      router.push("/dashboard");
      resetReminder();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes. Please try again.");
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
  }, 1000); // Save every second

  useEffect(() => {
    saveDraft();
  }, [notes, title, saveDraft]);

  const resetReminder = () => {
    localStorage.removeItem("reminder_draft");
    setTitle("");
    setNotes("");
    setNotifyAt(null);
  };

  return (
    <>
        <div className="flex flex-col h-full w-full px-6 max-w-md mx-auto">
          <div className="flex flex-col items-center mt-5 gap-5 flex-grow mb-10 h-full">
            <p className="text-gray-100 text-lg text-center">
              Add your reminders here
            </p>
            <div className="w-full">
              <TitleInput
                title={title}
                setTitle={setTitle}
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
            <div className="flex w-full flex-grow z-0">
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
    </>
  );
}
