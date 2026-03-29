import { ExerciseEntry, ExerciseInput } from "@/types/session";
import { useGymSettingsStore } from "@/lib/stores/gymSettingsStore";
import { useRestTimerStore } from "@/lib/stores/restTimerStore";
import { useUserStore } from "@/lib/stores/useUserStore";
import { createAudioPlayer } from "expo-audio";
import Toast from "react-native-toast-message";
import i18next from "i18next";

const pbSound = createAudioPlayer(
  require("@/assets/audio/freesound_community-success-1-6297.mp3"),
);

function checkPb(
  exercise: ExerciseEntry,
  newWeight: number,
  newReps: number,
  bestE1rmMap: Record<string, number>,
): boolean {
  if (newWeight === 0) return false;
  const prevBest = bestE1rmMap[exercise.exercise_id];
  if (prevBest == null) return false;

  // Check if any earlier set in this session already beat the record
  let runningBest = prevBest;
  for (const s of exercise.sets) {
    const w = s.weight || 0;
    const r = s.reps || 0;
    if (w === 0) continue;
    const e1rm = r <= 1 ? w : w * (1 + r / 30);
    if (e1rm > runningBest) runningBest = e1rm;
  }

  const newE1rm = newReps <= 1 ? newWeight : newWeight * (1 + newReps / 30);
  return newE1rm > runningBest;
}

export default function useLogSetForExercise({
  exercises,
  exerciseInputs,
  setExerciseInputs,
  setExercises,
  templateRestTimerSeconds,
  bestE1rmMap,
}: {
  exercises: ExerciseEntry[];
  exerciseInputs: ExerciseInput[];
  setExerciseInputs: (exerciseInputs: ExerciseInput[]) => void;
  setExercises: (exercises: ExerciseEntry[]) => void;
  templateRestTimerSeconds?: number | null;
  bestE1rmMap: Record<string, number>;
}) {
  const logSetForExercise = (index: number) => {
    const input = exerciseInputs[index];
    const exercise = exercises[index];
    const updated = [...exercises];

    const safeWeight = !input.weight ? 0 : Number(input.weight.replace(",", "."));
    const safeReps = input.reps === "" ? 0 : Number(input.reps);

    // Check PB before pushing the new set
    const isPb = checkPb(exercise, safeWeight, safeReps, bestE1rmMap);

    updated[index].sets.push({
      weight: safeWeight,
      reps: safeReps,
      rpe: input.rpe,
    });

    const updatedInputs = [...exerciseInputs];
    updatedInputs[index] = { weight: "", reps: "", rpe: "Medium" };

    setExerciseInputs(updatedInputs);
    setExercises(updated);

    if (isPb) {
      const pbSoundEnabled = useUserStore.getState().settings?.pb_sound_enabled;
      if (pbSoundEnabled) {
        pbSound.seekTo(0);
        pbSound.play();
      }
      Toast.show({
        type: "milestone",
        text1: i18next.t("gym:gym.exerciseHistory.newPb"),
        position: "top",
        visibilityTime: 4000,
      });
    }

    // Start rest timer: exercise-level → template-level → global default
    const { restTimerEnabled, restTimerDurationSeconds } =
      useGymSettingsStore.getState();
    const duration =
      exercise.rest_timer_seconds ?? templateRestTimerSeconds ?? (restTimerEnabled ? restTimerDurationSeconds : null);
    if (duration != null) {
      useRestTimerStore.getState().startRestTimer(duration);
    }
  };

  return {
    logSetForExercise,
  };
}
