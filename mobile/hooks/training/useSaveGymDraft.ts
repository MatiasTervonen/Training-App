import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { ExerciseEntry, ExerciseInput } from "@/types/session";
import { handleError } from "@/utils/handleError";

export default function useSaveGymDraft({
  exercises,
  notes,
  title,
  isEditing,
  setTitle,
  setExercises,
  setNotes,
  setExerciseInputs,
}: {
  exercises: ExerciseEntry[];
  notes: string;
  title: string;
  isEditing: boolean;
  setTitle: (title: string) => void;
  setExercises: (exercises: ExerciseEntry[]) => void;
  setNotes: (notes: string) => void;
  setExerciseInputs: (exerciseInputs: ExerciseInput[]) => void;
}) {
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  useEffect(() => {
    if (isEditing) return;

    const loadDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem("gym_session_draft");
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          setTitle(parsedDraft.title || "");
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
      } catch (error) {
        handleError(error, {
          message: "Error loading notes draft",
          route: "notes/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setHasLoadedDraft(true);
      }
    };
    loadDraft();
  }, [
    isEditing,
    setTitle,
    setExercises,
    setNotes,
    setExerciseInputs,
    setHasLoadedDraft,
  ]);

  const saveGymDraft = useDebouncedCallback(
    async () => {
      if (!hasLoadedDraft || isEditing) return;

      if (
        exercises.length === 0 &&
        notes.trim() === "" &&
        title.trim() === ""
      ) {
        AsyncStorage.removeItem("gym_session_draft");
        return;
      } else {
        const sessionDraft = {
          title,
          exercises,
          notes,
        };

        await AsyncStorage.setItem(
          "gym_session_draft",
          JSON.stringify(sessionDraft)
        );
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    saveGymDraft();
  }, [notes, title, exercises, saveGymDraft]);

  return {
    saveGymDraft,
  };
}
