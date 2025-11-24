"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/(app)/ui/save-button";
import DeleteSessionBtn from "@/app/(app)/ui/deleteSessionBtn";
import NotesInput from "@/app/(app)/ui/NotesInput";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { useDebouncedCallback } from "use-debounce";
import { saveNotesToDB } from "../database/notes";
import TitleInput from "../ui/TitleInput";
import { useQueryClient } from "@tanstack/react-query";

export default function Notes() {
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  const queryClient = useQueryClient();

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

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      router.push("/dashboard");
      resetNotes();
    } catch {
      setIsSaving(false);
      toast.error("Failed to save notes. Please try again.");
    }
  };

  return (
    <>
      <div className="flex flex-col h-full px-5 max-w-md mx-auto pt-5">
        <div className="flex flex-col items-center gap-5 grow mb-10">
          <p className="text-lg text-center">Add your notes here</p>
          <TitleInput
            value={title}
            setValue={setTitle}
            placeholder="Notes title..."
            label="Title..."
          />
          <NotesInput
            notes={notes}
            setNotes={setNotes}
            placeholder="Write your notes here..."
            label="Notes..."
            fillAvailableSpace
          />
        </div>
        <div className="flex flex-col items-center gap-5">
          <SaveButton onClick={saveNotes} />
          <DeleteSessionBtn onDelete={resetNotes} />
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
