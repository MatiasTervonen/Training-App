import {
  formatDate,
  formatTime,
  formatDuration,
} from "@/app/(app)/lib/formatDate";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { GroupExercises } from "@/app/(app)/utils/GroupExercises";
import { History } from "lucide-react";
import { getLastExerciseHistory } from "@/app/(app)/database/gym/last-exercise-history";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ExerciseHistoryModal from "@/app/(app)/gym/components/ExerciseHistoryModal";
import { useTranslation } from "react-i18next";
import { FullGymSession } from "@/app/(app)/database/gym/get-full-gym-session";
import { Clock } from "lucide-react";

export default function GymSession(gym_session: FullGymSession) {
  const { t } = useTranslation("gym");
  const [exerciseId, setExerciseId] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const groupedExercises = GroupExercises(
    gym_session.gym_session_exercises || [],
  );

  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  const isCardioExercise = (exercise: {
    gym_exercises: { main_group: string };
  }) => exercise.gym_exercises?.main_group.toLowerCase() === "cardio";

  const translateRpe = (rpe: string) => {
    const rpeMap: Record<string, string> = {
      "Warm-up": t("gym.exerciseCard.rpeOptions.warmup"),
      Easy: t("gym.exerciseCard.rpeOptions.easy"),
      Medium: t("gym.exerciseCard.rpeOptions.medium"),
      Hard: t("gym.exerciseCard.rpeOptions.hard"),
      Failure: t("gym.exerciseCard.rpeOptions.failure"),
    };
    return rpeMap[rpe] || rpe;
  };

  const {
    data: history,
    error: historyError,
    isLoading,
  } = useQuery({
    queryKey: ["exerciseHistory", exerciseId],
    queryFn: () => getLastExerciseHistory({ exerciseId }),
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
      <div className="text-sm text-gray-400 text-center">
        {formatDate(gym_session.created_at)}
      </div>
      <div className="flex flex-col gap-4 justify-center items-center bg-slate-900 rounded-md p-5 mt-5">
        <h2 className="text-xl mt-2 text-center">{gym_session.title}</h2>
        <div className="flex items-center gap-2">
          <Clock />
          <p className="text-lg text-center">
            {formatTime(gym_session.start_time)} -{" "}
            {formatTime(gym_session.end_time)}
          </p>
        </div>
        <h3 className="mt-2">
          {t("gym.analytics.duration")}: {formatDuration(gym_session.duration)}
        </h3>
        {gym_session.notes && (
          <p className="mt-4 text-gray-200 whitespace-pre-wrap wrap-break-word overflow-hidden max-w-full">
            {gym_session.notes}
          </p>
        )}
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
            <h3 className="text-lg my-2 text-center">
              {t("gym.gymForm.superSet")}
            </h3>
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
                <h3 className="text-sm text-gray-400">
                  {t(
                    `gym.equipment.${exercise.gym_exercises.equipment?.toLowerCase()}`,
                  )}{" "}
                  /{" "}
                  {t(
                    `gym.muscleGroups.${exercise.gym_exercises.muscle_group?.toLowerCase().replace(/ /g, "_")}`,
                  )}
                </h3>
              </div>
              <div className="py-2 whitespace-pre-wrap wrap-break-word overflow-hidden max-w-full">
                {exercise.notes || ""}
              </div>
              <table className="w-full text-center">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 font-normal">
                      {t("gym.exerciseCard.set")}
                    </th>
                    {isCardioExercise(exercise) ? (
                      <>
                        <th className="p-2 font-normal">
                          {t("gym.exerciseCard.timePlaceholder")}
                        </th>
                        <th className="p-2 font-normal">
                          {t("gym.exerciseCard.lengthPlaceholder")}
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="p-2 font-normal">
                          {t("gym.exerciseCard.weight")}
                        </th>
                        <th className="p-2 font-normal">
                          {t("gym.exerciseCard.reps")}
                        </th>
                        <th className="p-2 font-normal">
                          {t("gym.exerciseCard.rpe")}
                        </th>
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
                          <td className="p-2 max-w-[70px] truncate">
                            {set.rpe ? translateRpe(set.rpe) : ""}
                          </td>
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
