import { ExerciseEntry, ExerciseInput } from "@/types/session";
import { useGymSettingsStore } from "@/lib/stores/gymSettingsStore";
import { useRestTimerStore } from "@/lib/stores/restTimerStore";

export default function useLogSetForExercise({
  exercises,
  exerciseInputs,
  setExerciseInputs,
  setExercises,
  templateRestTimerSeconds,
}: {
  exercises: ExerciseEntry[];
  exerciseInputs: ExerciseInput[];
  setExerciseInputs: (exerciseInputs: ExerciseInput[]) => void;
  setExercises: (exercises: ExerciseEntry[]) => void;
  templateRestTimerSeconds?: number | null;
}) {
  const logSetForExercise = (index: number) => {
    const input = exerciseInputs[index];
    const exercise = exercises[index];
    const updated = [...exercises];

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
    setExercises(updated);

    // Start rest timer: exercise-level → template-level → global default
    const { restTimerEnabled, restTimerDurationSeconds } =
      useGymSettingsStore.getState();
    if (restTimerEnabled) {
      const duration =
        exercise.rest_timer_seconds ?? templateRestTimerSeconds ?? restTimerDurationSeconds;
      useRestTimerStore.getState().startRestTimer(duration);
    }
  };

  return {
    logSetForExercise,
  };
}
