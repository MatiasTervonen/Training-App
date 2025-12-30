"use client";

import { generateUUID } from "@/app/(app)/lib/generateUUID";
import { ExerciseEntry } from "@/app/(app)/types/session";

export default function useAddExercise({
  exerciseType,
  supersetExercise,
  normalExercises,
  setExercises,
  setSupersetExercise,
  setNormalExercises,
}: {
  exerciseType: string;
  supersetExercise: ExerciseEntry[];
  normalExercises: ExerciseEntry[];
  setExercises: (
    exercises: ExerciseEntry[] | ((prev: ExerciseEntry[]) => ExerciseEntry[])
  ) => void;
  setSupersetExercise: (supersetExercise: ExerciseEntry[]) => void;
  setNormalExercises: (normalExercises: ExerciseEntry[]) => void;
}) {
  const handleAddExercise = () => {
    const newSupersetId = generateUUID();

    if (exerciseType === "Super-Set") {
      const validExercises = supersetExercise.filter(
        (ex) => ex && typeof ex.name === "string" && ex.name.trim() !== ""
      );
      if (validExercises.length === 0) return;

      const newGroup = validExercises.map((ex) => ({
        ...ex,
        superset_id: newSupersetId,
      }));

      setExercises((prev) => [...prev, ...newGroup]);
      setSupersetExercise([]);
    } else {
      const validNormal = normalExercises.filter(
        (ex) => ex.name && ex.name.trim() !== ""
      );
      if (validNormal.length === 0) return;

      const updated = validNormal.map((ex) => ({
        ...ex,
        superset_id: generateUUID(),
      }));

      setExercises((prev) => [...prev, ...updated]);
      setNormalExercises([]);
    }
  };

  return {
    handleAddExercise,
  };
}
