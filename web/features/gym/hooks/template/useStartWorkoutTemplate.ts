"use client";

import { useTimerStore } from "@/lib/stores/timerStore";
import { toast } from "react-hot-toast";
import { ExerciseEntry } from "@/types/session";
import { useRouter } from "next/navigation";
import { FullGymTemplate } from "@/database/gym/templates/full-gym-template";

export default function useStartWorkoutTemplate() {
  const activeSession = useTimerStore((state) => state.activeSession);
  const router = useRouter();

  const startWorkout = (template: FullGymTemplate) => {
    if (activeSession) {
      toast.error("You already have an active workout!");
      return;
    }

    const workoutExercises: ExerciseEntry[] =
      template.gym_template_exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        template_id: template.id,
        name: ex.gym_exercises.name,
        equipment: ex.gym_exercises.equipment,
        muscle_group: ex.gym_exercises.muscle_group ?? undefined,
        main_group: ex.gym_exercises.main_group,
        sets: [],
        position: ex.position,
        superset_id: ex.superset_id,
      }));

    const sessionDraft = {
      title: template.name,
      exercises: workoutExercises,
    };

    localStorage.setItem("gym_draft", JSON.stringify(sessionDraft));
    localStorage.setItem("startedFromTemplate", "true");
    router.push("/gym/gym");
  };
  return {
    startWorkout,
  };
}
