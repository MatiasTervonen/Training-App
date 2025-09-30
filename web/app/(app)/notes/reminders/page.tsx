"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/(app)/ui/save-button";
import DeleteSessionBtn from "@/app/(app)/ui/deleteSessionBtn";
import ModalPageWrapper from "@/app/(app)/components/modalPageWrapper";
import NotesInput from "@/app/(app)/training/components/NotesInput";
import TitleInput from "@/app/(app)/training/components/TitleInput";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { useDebouncedCallback } from "use-debounce";
import { updateFeed } from "@/app/(app)/lib/revalidateFeed";
import DateTimePicker from "@/app/(app)/components/DateTimePicker";

export default function Notes() {
  const draft =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("notes_draft") || "null")
      : null;

  const [notes, setNotes] = useState(draft?.notes || "");
  const [notesTitle, setNotesTitle] = useState(draft?.title || "");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const router = useRouter();

  const saveNotes = async () => {
    if (notes.length === 0) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/notes/save-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: notesTitle,
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
      resetNotes();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes. Please try again.");
      setIsSaving(false);
    }
  };

  const saveDraft = useDebouncedCallback(() => {
    if (notes.trim().length === 0 && notesTitle.trim().length === 0) {
      localStorage.removeItem("notes_draft");
    } else {
      const sessionDraft = {
        title: notesTitle,
        notes,
      };
      localStorage.setItem("notes_draft", JSON.stringify(sessionDraft));
    }
  }, 1000); // Save every second

  useEffect(() => {
    saveDraft();
  }, [notes, notesTitle, saveDraft]);

  const resetNotes = () => {
    localStorage.removeItem("notes_draft");
    setNotesTitle("");
    setNotes("");
  };

  return (
    <>
      <ModalPageWrapper>
        <div className="flex flex-col h-full w-full px-6 max-w-md mx-auto">
          <div className="flex flex-col items-center mt-5 gap-5 flex-grow mb-10 h-full">
            <p className="text-gray-100 text-lg text-center">
              Add your reminders here
            </p>
            <div className="w-full">
              <TitleInput
                title={notesTitle}
                setTitle={setNotesTitle}
                placeholder="Reminder title..."
                label="Title..."
              />
            </div>
            <div className="z-50 w-full">
              <DateTimePicker
                value={notifyAt}
                onChange={setNotifyAt}
                label="Notify at:"
              />
            </div>
            <div className="flex w-full flex-grow z-0">
              <NotesInput
                notes={notes}
                setNotes={setNotes}
                placeholder="Write your notes here..."
                label="Notes..."
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-5 mb-10  self-center w-full">
            <SaveButton onClick={saveNotes} />
            <DeleteSessionBtn onDelete={resetNotes} />
          </div>
        </div>
      </ModalPageWrapper>
      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
