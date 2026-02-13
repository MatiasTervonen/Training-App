"use client";

import { useMemo } from "react";
import Modal from "@/components/modal";
import Spinner from "@/components/spinner";
import {
  formatDateShort,
  formatDateWithYear,
} from "@/lib/formatDate";
import { HistoryResult } from "@/types/session";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useTranslation } from "react-i18next";
import ExerciseHistoryChart from "@/features/gym/components/ExerciseHistory/components/ExerciseHistoryChart";

type ExerciseHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  history: HistoryResult;
  error?: string | null;
};

export default function ExerciseHistoryModal({
  isOpen,
  onClose,
  isLoading,
  history,
  error,
}: ExerciseHistoryModalProps) {
  const { t } = useTranslation("gym");
  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  const exerciseName = history?.[0]?.name;
  const rawEquipment = history?.[0]?.equipment;
  const equipment = rawEquipment
    ? t(`gym.equipment.${rawEquipment.toLowerCase()}`)
    : "";
  const isCardio = history?.[0]?.main_group === "cardio";

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

  // Personal best calculation
  const personalBest = useMemo(() => {
    if (!history || history.length === 0) return null;

    if (isCardio) {
      let bestDistance = 0;
      let bestTime = 0;
      let bestDate = "";
      for (const session of history) {
        for (const set of session.sets) {
          if (set.distance_meters && set.distance_meters > bestDistance) {
            bestDistance = set.distance_meters;
            bestTime = set.time_min || 0;
            bestDate = session.date;
          }
        }
      }
      if (bestDistance === 0) return null;
      return { distance: bestDistance, time: bestTime, date: bestDate };
    } else {
      let bestWeight = 0;
      let bestReps = 0;
      let bestDate = "";
      for (const session of history) {
        for (const set of session.sets) {
          if (set.weight && set.weight > bestWeight) {
            bestWeight = set.weight;
            bestReps = set.reps || 0;
            bestDate = session.date;
          }
        }
      }
      if (bestWeight === 0) return null;
      return { weight: bestWeight, reps: bestReps, date: bestDate };
    }
  }, [history, isCardio]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {isLoading ? (
        <div className="text-lg flex flex-col justify-center items-center mt-40 gap-5 mx-4">
          <p>{t("gym.exerciseHistory.loadingHistory")}</p>
          <Spinner size="w-[30px] h-[30px]" />
        </div>
      ) : error ? (
        <p className="text-center mt-20 mx-4">
          {t("gym.exerciseHistory.loadError")}
        </p>
      ) : history.length === 0 ? (
        <p className="text-center mt-20 text-lg mx-4 ">
          {t("gym.exerciseHistory.noHistory")}
        </p>
      ) : (
        <div className="px-4 max-w-lg mx-auto">
          {/* Header */}
          <div className="flex flex-col mt-10 items-center rounded-md">
            <p className="text-lg">{exerciseName}</p>
            <p className="text-gray-300">{equipment}</p>
          </div>

          {/* Chart */}
          <ExerciseHistoryChart
            history={history}
            isCardio={isCardio}
            valueUnit={weightUnit}
          />

          {/* Personal Best */}
          {personalBest && (
            <div className="mt-6 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-md px-4 py-4 shadow-md border-2 border-gray-600">
              <p className="text-center text-gray-400 text-sm mb-2">
                {t("gym.exerciseHistory.personalBest")}
              </p>
              {"weight" in personalBest ? (
                <p className="text-center text-xl text-cyan-400">
                  {personalBest.weight} {weightUnit} x {personalBest.reps}{" "}
                  {t("gym.exerciseCard.reps").toLowerCase()}
                </p>
              ) : (
                <p className="text-center text-2xl text-cyan-400">
                  {personalBest.distance} m &middot; {personalBest.time}{" "}
                  {t("gym.exerciseHistory.timeMin").toLowerCase()}
                </p>
              )}
              <p className="text-center text-gray-400 text-sm mt-1">
                {formatDateWithYear(personalBest.date)}
              </p>
            </div>
          )}

          {/* Session History Tables */}
          <div className="flex flex-col items-center mb-20">
            {history.map((session, sessionIndex) => (
              <div key={sessionIndex} className="w-full">
                <div className="flex flex-col items-center mt-10">
                  <p className="text-lg">{formatDateShort(session!.date)}</p>
                  <div className="mt-6 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-md px-4 pb-5 pt-2 shadow-md w-full border-2 border-gray-600">
                    <table className="w-full text-center">
                      <thead>
                        <tr className="border-b">
                          {session?.main_group === "cardio" ? (
                            <>
                              <th className="p-2 font-normal">
                                {t("gym.exerciseCard.set")}
                              </th>
                              <th className="p-2 font-normal">
                                {t("gym.exerciseHistory.timeMin")}
                              </th>
                              <th className="p-2 font-normal">
                                {t("gym.exerciseHistory.distanceMeters")}
                              </th>
                              <th className="p-2 font-normal"></th>
                            </>
                          ) : (
                            <>
                              <th className="p-2 font-normal">
                                {t("gym.exerciseCard.set")}
                              </th>
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
                        {session!.sets.map((set, setIndex) => (
                          <tr
                            key={setIndex}
                            className={`mb-2 border-b ${
                              set.rpe === "Failure" ? "bg-red-500" : ""
                            } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                          >
                            {session?.main_group === "cardio" ? (
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
