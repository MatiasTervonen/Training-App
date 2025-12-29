import { ExerciseEntry, ExerciseInput } from "@/types/session";

export default function useLogSetForExercise({
  exercises,
  exerciseInputs,
  setExerciseInputs,
  setExercises,
}: {
  exercises: ExerciseEntry[];
  exerciseInputs: ExerciseInput[];
  setExerciseInputs: (exerciseInputs: ExerciseInput[]) => void;
  setExercises: (exercises: ExerciseEntry[]) => void;
}) {
  const logSetForExercise = (index: number) => {
    const { weight, reps, rpe } = exerciseInputs![index];

    const safeWeight = weight === "" ? 0 : Number(weight);
    const safeReps = reps === "" ? 0 : Number(reps);

    const updated = [...exercises];
    updated[index].sets.push({
      weight: safeWeight,
      reps: safeReps,
      rpe: rpe,
    });
    setExercises(updated);

    const updatedInputs = [...exerciseInputs];
    updatedInputs[index] = { weight: "", reps: "", rpe: "Medium" };
    setExerciseInputs(updatedInputs);
  };
  return {
    logSetForExercise,
  };
}
