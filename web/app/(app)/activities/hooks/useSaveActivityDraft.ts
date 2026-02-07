"use client";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { activities_with_category } from "@/app/(app)/types/models";

const DRAFT_KEY = "activity_draft";

type DraftData = {
  title: string;
  notes: string;
  activityId: string;
  activityName: string;
};

export default function useSaveActivityDraft({
  title,
  notes,
  selectedActivity,
  activityName,
  setTitle,
  setNotes,
  setActivityName,
  setSelectedActivity,
  isLoaded,
  setIsLoaded,
}: {
  title: string;
  notes: string;
  selectedActivity: activities_with_category | null;
  activityName: string;
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setActivityName: (name: string) => void;
  setSelectedActivity: (activity: activities_with_category | null) => void;
  isLoaded: boolean;
  setIsLoaded: (loaded: boolean) => void;
}) {
  const saveDraft = useDebouncedCallback(
    () => {
      if (!isLoaded) return;

      if (
        title.trim().length === 0 &&
        notes.trim().length === 0 &&
        !selectedActivity
      ) {
        localStorage.removeItem(DRAFT_KEY);
      } else {
        const draft: DraftData = {
          title,
          notes,
          activityId: selectedActivity?.id ?? "",
          activityName,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 },
  );

  // Restore draft on mount
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const draft: DraftData = JSON.parse(raw);
        if (draft.title) setTitle(draft.title);
        if (draft.notes) setNotes(draft.notes);
        if (draft.activityName) setActivityName(draft.activityName);
        if (draft.activityId) {
          setSelectedActivity({
            id: draft.activityId,
            name: draft.activityName,
          } as activities_with_category);
        }
      } catch {
        // ignore corrupt draft
      }
    }
    setIsLoaded(true);
  }, [setIsLoaded, setTitle, setNotes, setActivityName, setSelectedActivity]);

  // Save draft on changes
  useEffect(() => {
    saveDraft();
  }, [title, notes, selectedActivity, activityName, saveDraft]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  return { clearDraft };
}
