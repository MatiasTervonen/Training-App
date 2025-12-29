import { ExerciseEntry, ExerciseInput } from "@/types/session";
import * as Crypto from "expo-crypto";

export default function useAddExercise({
  exerciseType,
  supersetExercise,
  normalExercises,
  setExercises,
  setSupersetExercise,
  setNormalExercises,
  setDropdownResetKey,
  setExerciseInputs,
  isCardioExercise,
}: {
  exerciseType: string;
  supersetExercise: ExerciseEntry[];
  normalExercises: ExerciseEntry[];
  setExercises: (
    exercises: ExerciseEntry[] | ((prev: ExerciseEntry[]) => ExerciseEntry[])
  ) => void;
  setSupersetExercise: (supersetExercise: ExerciseEntry[]) => void;
  setNormalExercises: (
    normalExercises:
      | ExerciseEntry[]
      | ((prev: ExerciseEntry[]) => ExerciseEntry[])
  ) => void;
  setDropdownResetKey: (
    dropdownResetKey: number | ((prev: number) => number)
  ) => void;
  setExerciseInputs: (
    exerciseInputs:
      | ExerciseInput[]
      | ((prev: ExerciseInput[]) => ExerciseInput[])
  ) => void;
  isCardioExercise: (exercise: ExerciseEntry) => boolean;
}) {
  const handleAddExercise = () => {
    const newSupersetId = Crypto.randomUUID();

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
      setExerciseInputs((prev) => [
        ...prev,
        ...newGroup.map((ex) => ({
          weight: "",
          reps: "",
          rpe: isCardioExercise(ex) ? "Warm-up" : "Medium",
        })),
      ]);
      setSupersetExercise([]);
    } else {
      const validNormal = normalExercises.filter(
        (ex) => ex.name && ex.name.trim() !== ""
      );
      if (validNormal.length === 0) return;

      const updated = validNormal.map((ex) => ({
        ...ex,
        superset_id: Crypto.randomUUID(),
      }));

      setExercises((prev) => [...prev, ...updated]);
      setExerciseInputs((prev) => [
        ...prev,
        ...updated.map((ex) => ({
          weight: "",
          reps: "",
          rpe: isCardioExercise(ex) ? "Warm-up" : "Medium",
        })),
      ]);
      setNormalExercises([]);
    }

    setDropdownResetKey((prev) => prev + 1); // Reset dropdown
  };
  return {
    handleAddExercise,
  };
}
