"use client";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function useSaveDraft({
  title,
  notes,
  setTitle,
  setNotes,
  setIsLoaded,
  isLoaded,
}: {
  title: string;
  notes: string;
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  isLoaded: boolean;
}) {
  const saveDraft = useDebouncedCallback(
    () => {
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
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    const draft = localStorage.getItem("notes_draft");
    if (draft) {
      const { title: savedTitle, notes: savedNotes } = JSON.parse(draft);
      if (savedTitle) setTitle(savedTitle);
      if (savedNotes) setNotes(savedNotes);
    }
    setIsLoaded(true);
  }, [setIsLoaded, setNotes, setTitle]);

  useEffect(() => {
    saveDraft();
  }, [notes, title, saveDraft]);

  return {
    saveDraft,
  };
}
