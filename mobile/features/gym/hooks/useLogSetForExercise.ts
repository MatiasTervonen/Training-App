import { ExerciseEntry, ExerciseInput } from "@/types/session";
import { useGymSettingsStore } from "@/lib/stores/gymSettingsStore";
import { useRestTimerStore } from "@/lib/stores/restTimerStore";

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
    const input = exerciseInputs[index];
    const exercise = exercises[index];
    const updated = [...exercises];

    const isCardio = (exercise.main_group || "").toLowerCase() === "cardio";

    if (isCardio) {
      const safeTime = input.time_min === "" ? 0 : Number(input.time_min);
      const safeDistance =
        input.distance_meters === "" ? 0 : Number(input.distance_meters);

      updated[index].sets.push({
        time_min: safeDistance,
        distance_meters: safeTime,
      });

      const updatedInputs = [...exerciseInputs];
      updatedInputs[index] = { ...input, time_min: "", distance_meters: "" };

      setExerciseInputs(updatedInputs);
    } else {
      const safeWeight = !input.weight ? 0 : Number(input.weight.replace(",", "."));
      const safeReps = input.reps === "" ? 0 : Number(input.reps);

      updated[index].sets.push({
        weight: safeWeight,
        reps: safeReps,
        rpe: input.rpe,
      });

      const updatedInputs = [...exerciseInputs];
      updatedInputs[index] = { weight: "", reps: "", rpe: "Medium" };

      setExerciseInputs(updatedInputs);
    }

    setExercises(updated);

    // Start rest timer if enabled
    const { restTimerEnabled, restTimerDurationSeconds } =
      useGymSettingsStore.getState();
    if (restTimerEnabled) {
      useRestTimerStore.getState().startRestTimer(restTimerDurationSeconds);
    }
  };

  return {
    logSetForExercise,
  };
}
