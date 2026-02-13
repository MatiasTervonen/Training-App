"use client";

import { generateUUID } from "@/lib/generateUUID";
import { ExerciseEntry, ExerciseInput } from "@/types/session";

export default function useStartExercise({
  exercises,
  setExercises,
  setExerciseInputs,
  setSupersetExercise,
  setNormalExercises,
  startSession,
  exerciseType,
  supersetExercise,
  normalExercises,
}: {
  exercises: ExerciseEntry[];
  setExercises: (
    exercises: ExerciseEntry[] | ((prev: ExerciseEntry[]) => ExerciseEntry[])
  ) => void;
  setExerciseInputs: (
    exerciseInputs:
      | ExerciseInput[]
      | ((prev: ExerciseInput[]) => ExerciseInput[])
  ) => void;
  setSupersetExercise: (supersetExercise: ExerciseEntry[]) => void;
  setNormalExercises: (normalExercises: ExerciseEntry[]) => void;
  startSession: () => void;
  exerciseType: string;
  supersetExercise: ExerciseEntry[];
  normalExercises: ExerciseEntry[];
}) {
  const startExercise = () => {
    const newSupersetId = generateUUID();

    if (exercises.length === 0) {
      startSession();
    }

    if (exerciseType === "Super-Set") {
      const validExercises = supersetExercise.filter(
        (ex) => ex && typeof ex.name === "string" && ex.name.trim() !== ""
      );
      if (validExercises.length === 0) return;

      const newGroup = validExercises.map((ex) => ({
        ...ex,
        superset_id: newSupersetId,
      }));

      setExercises((prev) => {
        const updated = [...prev, ...newGroup];
        setExerciseInputs((inputs) => [
          ...inputs,
          ...newGroup.map(() => ({ weight: "", reps: "", rpe: "Medium" })),
        ]);
        return updated;
      });
      setSupersetExercise([]);
    } else {
      const validNormal = normalExercises.filter(
        (ex) => ex.name && ex.name.trim() !== ""
      );
      if (validNormal.length === 0) return;

      // Assign new superset_id to each normal exercise (so they're grouped individually)
      const updated = validNormal.map((ex) => ({
        ...ex,
        superset_id: generateUUID(),
      }));

      setExercises((prev) => [...prev, ...updated]);
      setExerciseInputs((prev) => [
        ...prev,
        ...updated.map(() => ({
          weight: "",
          reps: "",
          rpe: "Medium",
          time_min: "",
          distance_meters: "",
        })),
      ]);
      setNormalExercises([]);
    }
  };
  return {
    startExercise,
  };
}
