import { formatDate } from "@/app/(app)/lib/formatDate";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { full_gym_session } from "../../types/models";
import { GroupExercises } from "@/app/(app)/utils/GroupExercises";
import { full_gym_exercises } from "../../types/models";
import { History } from "lucide-react";
import { getLastExerciseHistory } from "@/app/(app)/database/gym";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ExerciseHistoryModal from "@/app/(app)/training/components/ExerciseHistoryModal";

const formatDuration = (seconds: number) => {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default function GymSession(gym_session: full_gym_session) {
  const [exerciseId, setExerciseId] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const groupedExercises = GroupExercises(
    gym_session.gym_session_exercises || []
  );

  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  const isCardioExercise = (exercise: full_gym_exercises) =>
    exercise.gym_exercises.main_group.toLowerCase() === "cardio";

  const {
    data: history,
    error: historyError,
    isLoading,
  } = useQuery({
    queryKey: ["exerciseHistory", exerciseId],
    queryFn: () => getLastExerciseHistory(exerciseId),
    enabled: !!exerciseId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const openHistory = (exerciseId: string) => {
    setExerciseId(exerciseId);
    setIsHistoryOpen(true);
  };

  return (
    <div className="max-w-lg mx-auto page-padding">
      <div className="flex flex-col gap-2 justify-center items-center">
        <div className="text-sm text-gray-400">
          {formatDate(gym_session.created_at)}
        </div>
        <h2 className="text-xl mt-2">{gym_session.title}</h2>
        <h3 className="mt-2">
          Duration: {formatDuration(gym_session.duration)}
        </h3>
        <p className="mt-4 text-gray-200 whitespace-pre-wrap wrap-break-word overflow-hidden max-w-full">
          {gym_session.notes}
        </p>
      </div>
      {Object.entries(groupedExercises).map(([superset_id, group]) => (
        <div
          key={superset_id}
          className={`mt-10 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-md ${
            group.length > 1
              ? "border-2 border-blue-700"
              : "border-2 border-gray-700"
          }`}
        >
          {group.length > 1 && (
            <h3 className="text-lg my-2 text-center">Super-Set</h3>
          )}

          {group.map(({ exercise, index }) => (
            <div key={index} className="py-2 px-4 mb-4">
              <div className="flex justify-between flex-col mb-2 text-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg">
                    {index + 1}. {exercise.gym_exercises.name}
                  </h3>
                  <button
                    onClick={() => {
                      openHistory(exercise.gym_exercises.id);
                    }}
                  >
                    <History color="#f3f4f6" />
                  </button>
                </div>
                <h3 className="text-sm text-gray-300">
                  {exercise.gym_exercises.muscle_group} /{" "}
                  {exercise.gym_exercises.equipment}
                </h3>
              </div>
              <div className="py-2 whitespace-pre-wrap wrap-break-word overflow-hidden max-w-full">
                {exercise.notes || ""}
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 font-normal">Set</th>
                    {isCardioExercise(exercise) ? (
                      <>
                        <th className="p-2 font-normal">Time (min)</th>
                        <th className="p-2 font-normal">Distance (meters)</th>
                      </>
                    ) : (
                      <>
                        <th className="p-2 font-normal">Weight</th>
                        <th className="p-2 font-normal">Reps</th>
                        <th className="p-2 font-normal">Rpe</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {exercise.gym_sets.map((set, setIndex) => (
                    <tr
                      key={setIndex}
                      className={`${
                        set.rpe === "Failure" ? "bg-red-500" : "text-gray-100"
                      } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""} border-b`}
                    >
                      {isCardioExercise(exercise) ? (
                        <>
                          <td className="p-2">{setIndex + 1}</td>
                          <td className="p-2">{set.time_min}</td>
                          <td className="p-2">{set.distance_meters}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-2">{setIndex + 1}</td>
                          <td className="p-2">
                            {set.weight} {weightUnit}
                          </td>
                          <td className="p-2">{set.reps}</td>
                          <td className="p-2">{set.rpe}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}

      <ExerciseHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        isLoading={isLoading}
        history={history ? history : []}
        error={historyError ? historyError.message : null}
      />
    </div>
  );
}
