"use client";

import { useDebouncedCallback } from "use-debounce";
import { useEffect } from "react";
import { ExerciseEntry, ExerciseInput } from "../../types/session";

export default function useDraft({
  exercises,
  notes,
  sessionTitle,
  isEditing,
  hasLoadedDraft,
  setSessionTitle,
  setExercises,
  setNotes,
  setExerciseInputs,
  setHasLoadedDraft,
}: {
  exercises: ExerciseEntry[];
  notes: string;
  sessionTitle: string;
  isEditing: boolean;
  hasLoadedDraft: boolean;
  setSessionTitle: (sessionTitle: string) => void;
  setExercises: (exercises: ExerciseEntry[]) => void;
  setNotes: (notes: string) => void;
  setExerciseInputs: (exerciseInputs: ExerciseInput[]) => void;
  setHasLoadedDraft: (hasLoadedDraft: boolean) => void;
}) {
  const saveGymDraft = useDebouncedCallback(
    () => {
      if (!hasLoadedDraft || isEditing) return;

      if (
        exercises.length === 0 &&
        notes.trim() === "" &&
        sessionTitle.trim() === ""
      ) {
        localStorage.removeItem("gym_draft");
        return;
      }

      const sessionDraft = {
        title: sessionTitle,
        exercises,
        notes,
      };
      localStorage.setItem("gym_draft", JSON.stringify(sessionDraft));
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    if (!hasLoadedDraft) return;
    saveGymDraft();
  }, [exercises, notes, sessionTitle, hasLoadedDraft, isEditing, saveGymDraft]);

  useEffect(() => {
    if (isEditing) return;

    const draft = localStorage.getItem("gym_draft");
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      setSessionTitle(parsedDraft.title || "");
      setExercises(parsedDraft.exercises || []);
      setNotes(parsedDraft.notes || "");
      setExerciseInputs(
        parsedDraft.exercises
          ? parsedDraft.exercises.map(() => ({
              weight: "",
              reps: "",
              rpe: "Medium",
              time_min: "",
              distance_meters: "",
            }))
          : []
      );
    }

    setHasLoadedDraft(true);
  }, [
    setSessionTitle,
    setExercises,
    setNotes,
    setExerciseInputs,
    isEditing,
    setHasLoadedDraft,
  ]);

  return {
    saveGymDraft,
  };
}
