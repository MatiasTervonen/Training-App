import { ExerciseEntry } from "@/types/session";

export type ShareStats = {
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
};

export type TopExercise = {
  name: string;
  equipment: string;
  weight: number;
  reps: number;
};

export function computeShareStats(exercises: ExerciseEntry[]): ShareStats {
  const exerciseCount = exercises.length;
  const totalSets = exercises.reduce(
    (sum, ex) => sum + (ex.sets?.length ?? 0),
    0,
  );
  const totalVolume = exercises.reduce((sum, ex) => {
    return (
      sum +
      (ex.sets ?? []).reduce(
        (setSum, set) => setSum + (set.weight ?? 0) * (set.reps ?? 0),
        0,
      )
    );
  }, 0);

  return { exerciseCount, totalSets, totalVolume };
}

export function getTopExercises(
  exercises: ExerciseEntry[],
  limit = 3,
): TopExercise[] {
  return exercises
    .map((ex) => {
      const bestSet = (ex.sets ?? []).reduce(
        (best, set) => {
          const volume = (set.weight ?? 0) * (set.reps ?? 0);
          const bestVolume = (best.weight ?? 0) * (best.reps ?? 0);
          return volume > bestVolume ? set : best;
        },
        ex.sets?.[0] ?? {},
      );

      return {
        name: ex.name,
        equipment: ex.equipment,
        weight: bestSet.weight ?? 0,
        reps: bestSet.reps ?? 0,
      };
    })
    .filter((ex) => ex.weight > 0)
    .sort((a, b) => b.weight * b.reps - a.weight * a.reps)
    .slice(0, limit);
}
