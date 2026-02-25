"use client";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

const DRAFT_KEY = "feedback_draft";

export default function useSaveFeedbackDraft({
  category,
  title,
  message,
  setCategory,
  setTitle,
  setMessage,
  setIsLoaded,
  isLoaded,
}: {
  category: string;
  title: string;
  message: string;
  setCategory: (category: string) => void;
  setTitle: (title: string) => void;
  setMessage: (message: string) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  isLoaded: boolean;
}) {
  const saveDraft = useDebouncedCallback(
    () => {
      if (!isLoaded) return;

      if (
        title.trim().length === 0 &&
        message.replace(/<[^>]*>/g, "").trim().length === 0
      ) {
        localStorage.removeItem(DRAFT_KEY);
      } else {
        const draft = { category, title, message };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const draft = JSON.parse(raw);
        if (draft.category) setCategory(draft.category);
        if (draft.title) setTitle(draft.title);
        if (draft.message) setMessage(draft.message);
      } catch {
        // ignore corrupt draft
      }
    }
    setIsLoaded(true);
  }, [setCategory, setTitle, setMessage, setIsLoaded]);

  useEffect(() => {
    saveDraft();
  }, [category, title, message, saveDraft]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  return { clearDraft };
}
