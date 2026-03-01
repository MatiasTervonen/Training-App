"use client";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { UploadedImage } from "@/features/notes/components/TiptapEditor";

export default function useSaveDraft({
  title,
  notes,
  images,
  setTitle,
  setNotes,
  setImages,
  setIsLoaded,
  isLoaded,
}: {
  title: string;
  notes: string;
  images: UploadedImage[];
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setImages: (images: UploadedImage[]) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  isLoaded: boolean;
}) {
  const saveDraft = useDebouncedCallback(
    () => {
      if (!isLoaded) return;

      if (
        notes.trim().length === 0 &&
        title.trim().length === 0 &&
        images.length === 0
      ) {
        localStorage.removeItem("notes_draft");
      } else {
        const sessionDraft = {
          title,
          notes,
          images,
        };
        localStorage.setItem("notes_draft", JSON.stringify(sessionDraft));
      }
    },
    500,
    { maxWait: 3000 },
  );

  useEffect(() => {
    const draft = localStorage.getItem("notes_draft");
    if (draft) {
      const {
        title: savedTitle,
        notes: savedNotes,
        images: savedImages,
      } = JSON.parse(draft);
      if (savedTitle) setTitle(savedTitle);
      if (savedNotes) setNotes(savedNotes);
      if (savedImages && Array.isArray(savedImages)) setImages(savedImages);
    }
    setIsLoaded(true);
  }, [setIsLoaded, setNotes, setTitle, setImages]);

  useEffect(() => {
    saveDraft();
  }, [notes, title, images, saveDraft]);

  return {
    saveDraft,
  };
}
