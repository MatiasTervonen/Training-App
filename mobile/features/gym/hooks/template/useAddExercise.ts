import { ExerciseEntry, ExerciseInput } from "@/types/session";
import * as Crypto from "expo-crypto";

export default function useAddExercise({
  exerciseType,
  supersetExercise,
  normalExercises,
  setExercises,
  setSupersetExercise,
  setNormalExercises,
  setExerciseInputs,
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
  setExerciseInputs: (
    exerciseInputs:
      | ExerciseInput[]
      | ((prev: ExerciseInput[]) => ExerciseInput[])
  ) => void;
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
        ...newGroup.map(() => ({
          weight: "",
          reps: "",
          rpe: "Medium",
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
        ...updated.map(() => ({
          weight: "",
          reps: "",
          rpe: "Medium",
        })),
      ]);
      setNormalExercises([]);
    }
  };
  return {
    handleAddExercise,
  };
}
