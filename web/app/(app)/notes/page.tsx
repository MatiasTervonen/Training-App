"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/(app)/ui/save-button";
import DeleteSessionBtn from "@/app/(app)/ui/deleteSessionBtn";
import NotesInput from "@/app/(app)/ui/NotesInput";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { useDebouncedCallback } from "use-debounce";
import { updateFeed } from "@/app/(app)/lib/revalidateFeed";
import { saveNotesToDB } from "../database/notes";
import TitleInput from "../ui/TitleInput";

export default function Notes() {
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const draft = localStorage.getItem("notes_draft");
    if (draft) {
      const { title: savedTitle, notes: savedNotes } = JSON.parse(draft);
      if (savedTitle) setTitle(savedTitle);
      if (savedNotes) setNotes(savedNotes);
    }
    setIsLoaded(true);
  }, []);

  const saveDraft = useDebouncedCallback(() => {
    if (!isLoaded) return;

    if (notes.trim().length === 0 && title.trim().length === 0) {
      localStorage.removeItem("notes_draft");
    } else {
      const sessionDraft = {
        title,
        notes,
      };
      localStorage.setItem("notes_draft", JSON.stringify(sessionDraft));
    }
  }, 500);

  useEffect(() => {
    saveDraft();
  }, [notes, title, saveDraft]);

  const resetNotes = () => {
    localStorage.removeItem("notes_draft");
    setTitle("");
    setNotes("");
  };

  const saveNotes = async () => {
    if (notes.trim().length === 0) return;

    setIsSaving(true);
    try {
      await saveNotesToDB({ title, notes });

      await updateFeed();
      router.push("/dashboard");
      resetNotes();
    } catch {
      setIsSaving(false);
      toast.error("Failed to save notes. Please try again.");
    }
  };

  return (
    <>
      <div className="flex flex-col h-full w-full px-6 max-w-md mx-auto">
        <div className="flex flex-col items-center mt-5 gap-5 grow mb-10 h-full">
          <p className="text-gray-100 text-lg text-center">
            Add your notes here
          </p>
          <div className="mb-5 w-full">
            <TitleInput
              value={title}
              setValue={setTitle}
              placeholder="Notes title..."
              label="Title..."
            />
          </div>
          <div className="w-full flex-1 flex">
            <NotesInput
              notes={notes}
              setNotes={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
              fillAvailableSpace
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-5 mb-10  self-center w-full">
          <SaveButton onClick={saveNotes} />
          <DeleteSessionBtn onDelete={resetNotes} />
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
