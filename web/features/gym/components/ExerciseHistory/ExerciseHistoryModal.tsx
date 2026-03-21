"use client";

import { useMemo } from "react";
import Modal from "@/components/modal";
import Spinner from "@/components/spinner";
import { formatDateShort } from "@/lib/formatDate";
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
  const { t, i18n } = useTranslation("gym");
  const locale = i18n.language;
  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  const exerciseName = history?.[0]?.name;
  const rawEquipment = history?.[0]?.equipment;
  const equipment = rawEquipment
    ? t(`gym.equipment.${rawEquipment.toLowerCase()}`)
    : "";

  const translateRpe = (rpe: string) => {
    const rpeMap: Record<string, string> = {
      "Warm-up": "1",
      Easy: "2",
      Medium: "3",
      Hard: "4",
      Failure: "5",
    };
    return rpeMap[rpe] || rpe;
  };

  const personalBest = useMemo(() => {
    if (!history || history.length === 0) return null;

    let bestWeight = 0;
    let bestReps = 0;
    let bestDate = "";
    for (const session of history) {
      if (!session) continue;
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
  }, [history]);

  const formatDateWithYear = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="px-5 max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center mt-40 gap-5 mx-4">
            <p className="text-lg font-body">
              {t("gym.exerciseHistory.loadingHistory")}
            </p>
            <Spinner size="w-[30px] h-[30px]" />
          </div>
        ) : error ? (
          <p className="text-center mt-20 mx-4 font-body">
            {t("gym.exerciseHistory.loadError")}
          </p>
        ) : history.length === 0 ? (
          <p className="text-center mt-20 text-lg mx-4 font-body">
            {t("gym.exerciseHistory.noHistory")}
          </p>
        ) : (
          <div className="pt-4 pb-12">
            {/* Header */}
            <div className="mb-10">
              <p className="text-center text-xl">{exerciseName}</p>
              <p className="text-center text-gray-300 mt-2 font-body">
                {equipment}
              </p>

              {/* Chart */}
              <ExerciseHistoryChart
                history={history}
                valueUnit={weightUnit}
              />

              {/* Personal Best */}
              {personalBest && (
                <div
                  className="mt-6 rounded-md px-4 py-4 border-[1.5px] border-gray-700"
                  style={{
                    background:
                      "linear-gradient(to bottom left, #1e3a8a, #0f172a, #0f172a)",
                  }}
                >
                  <p className="text-center text-gray-400 text-sm mb-2 font-body">
                    {t("gym.exerciseHistory.personalBest")}
                  </p>
                  <p className="text-center text-xl text-cyan-400">
                    {personalBest.weight} {weightUnit} x {personalBest.reps}{" "}
                    {t("gym.exerciseCard.reps").toLowerCase()}
                  </p>
                  <p className="text-center text-gray-400 text-sm mt-1 font-body">
                    {formatDateWithYear(personalBest.date)}
                  </p>
                </div>
              )}
            </div>

            {/* Session History */}
            {history.map((session, sessionIndex) => (
              <div
                key={sessionIndex}
                className="py-5 px-4 rounded-md mb-5 border-[1.5px] border-gray-700"
                style={{
                  background:
                    "linear-gradient(to bottom left, #1e3a8a, #0f172a, #0f172a)",
                }}
              >
                <p className="text-base text-gray-300 mb-3 text-center font-body">
                  {formatDateShort(session!.date)}
                </p>
                <table className="w-full text-center">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-2 font-normal text-sm text-gray-400">
                        {t("gym.exerciseCard.set")}
                      </th>
                      <th className="p-2 font-normal text-sm text-gray-400">
                        {t("gym.exerciseCard.weight")}
                      </th>
                      <th className="p-2 font-normal text-sm text-gray-400">
                        {t("gym.exerciseCard.reps")}
                      </th>
                      <th className="p-2 font-normal text-sm text-gray-400">
                        {t("gym.exerciseCard.rpe")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {session!.sets.map((set, setIndex) => (
                      <tr
                        key={setIndex}
                        className={`border-b border-gray-700 ${
                          set.rpe === "Failure" ? "bg-red-500" : ""
                        } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                      >
                        <td className="p-2">{setIndex + 1}</td>
                        <td className="p-2">
                          {set.weight} {weightUnit}
                        </td>
                        <td className="p-2">{set.reps}</td>
                        <td className="p-2 max-w-[70px] truncate">
                          {set.rpe ? translateRpe(set.rpe) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
