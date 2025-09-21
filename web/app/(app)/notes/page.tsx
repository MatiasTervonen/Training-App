"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/(app)/ui/save-button";
import DeleteSessionBtn from "../ui/deleteSessionBtn";
import ModalPageWrapper from "../components/modalPageWrapper";
import NotesInput from "../training/components/NotesInput";
import TitleInput from "../training/components/TitleInput";
import FullScreenLoader from "../components/FullScreenLoader";
import toast from "react-hot-toast";
import { useDebouncedCallback } from "use-debounce";
import { updateFeed } from "../lib/revalidateFeed";

export default function Notes() {
  const draft =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("notes_draft") || "null")
      : null;

  const [notes, setNotes] = useState(draft?.notes || "");
  const [notesTitle, setNotesTitle] = useState(draft?.title || "");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const saveNotes = async () => {
    if (notes.length === 0) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/notes/save-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: notesTitle,
          notes,
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
              Add your notes here
            </p>
            <div className="mb-5">
              <TitleInput
                title={notesTitle}
                setTitle={setNotesTitle}
                placeholder="Notes title..."
                label="Title..."
              />
            </div>
            <div className="flex w-full flex-grow">
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
