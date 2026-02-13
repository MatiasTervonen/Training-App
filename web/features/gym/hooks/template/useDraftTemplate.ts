"use client";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { ExerciseEntry } from "@/types/session";

export default function useDraftTemplate({
  exercises,
  workoutName,
  hasLoadedDraft,
  isEditing,
  setWorkoutName,
  setExercises,
  setHasLoadedDraft,
}: {
  exercises: ExerciseEntry[];
  workoutName: string;
  hasLoadedDraft: boolean;
  isEditing: boolean;
  setWorkoutName: (workoutName: string) => void;
  setExercises: (exercises: ExerciseEntry[]) => void;
  setHasLoadedDraft: (hasLoadedDraft: boolean) => void;
}) {
  const saveTemplateDraft = useDebouncedCallback(
    () => {
      if (!hasLoadedDraft || isEditing) return;

      if (exercises.length === 0 && workoutName.trim() === "") {
        localStorage.removeItem("template_draft");
        return;
      }

      const sessionDraft = {
        title: workoutName,
        exercises,
      };
      localStorage.setItem("template_draft", JSON.stringify(sessionDraft));
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    if (!hasLoadedDraft) return;
    saveTemplateDraft();
  }, [exercises, workoutName, hasLoadedDraft, isEditing, saveTemplateDraft]);

  useEffect(() => {
    if (isEditing) return;

    const draft = localStorage.getItem("template_draft");
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      setWorkoutName(parsedDraft.title || "");
      setExercises(parsedDraft.exercises || []);
    }

    setHasLoadedDraft(true);
  }, [setWorkoutName, setExercises, isEditing, setHasLoadedDraft]);
  return {
    saveTemplateDraft,
  };
}
