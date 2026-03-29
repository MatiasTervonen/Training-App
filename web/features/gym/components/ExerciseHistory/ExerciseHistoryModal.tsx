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
  const { t } = useTranslation("gym");
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

  const personalBests = useMemo(() => {
    if (!history || history.length === 0) return null;

    let bestWeight = { weight: 0, reps: 0, date: "" };
    let bestE1rm = { e1rm: 0, weight: 0, reps: 0, date: "" };
    let bestVolume = { volume: 0, weight: 0, reps: 0, date: "" };

    for (const session of history) {
      if (!session) continue;
      for (const set of session.sets) {
        const w = set.weight || 0;
        const r = set.reps || 0;
        if (w === 0) continue;

        if (w > bestWeight.weight) {
          bestWeight = { weight: w, reps: r, date: session.date };
        }

        const e1rm = r <= 1 ? w : w * (1 + r / 30);
        if (e1rm > bestE1rm.e1rm) {
          bestE1rm = { e1rm, weight: w, reps: r, date: session.date };
        }

        const volume = w * r;
        if (volume > bestVolume.volume) {
          bestVolume = { volume, weight: w, reps: r, date: session.date };
        }
      }
    }

    if (bestWeight.weight === 0) return null;
    return { bestWeight, bestE1rm, bestVolume };
  }, [history]);

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

              {/* Personal Bests */}
              {personalBests && (
                <div className="mt-6 space-y-3">
                  <p className="text-center text-base">
                    {t("gym.exerciseHistory.personalBests")}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Best Est. 1RM */}
                    <div
                      className="rounded-md px-2 py-3 border-[1.5px] border-gray-700"
                      style={{
                        background:
                          "linear-gradient(to bottom left, #1e3a8a, #0f172a, #0f172a)",
                      }}
                    >
                      <p className="text-center text-gray-400 text-xs mb-1 font-body">
                        {t("gym.exerciseHistory.estOneRm")}
                      </p>
                      <p className="text-center text-base text-cyan-400">
                        {Math.round(personalBests.bestE1rm.e1rm)} {weightUnit}
                      </p>
                      <p className="text-center text-gray-500 text-xs mt-1 font-body">
                        {personalBests.bestE1rm.weight} × {personalBests.bestE1rm.reps}
                      </p>
                    </div>

                    {/* Heaviest Weight */}
                    <div
                      className="rounded-md px-2 py-3 border-[1.5px] border-gray-700"
                      style={{
                        background:
                          "linear-gradient(to bottom left, #1e3a8a, #0f172a, #0f172a)",
                      }}
                    >
                      <p className="text-center text-gray-400 text-xs mb-1 font-body">
                        {t("gym.exerciseHistory.heaviestWeight")}
                      </p>
                      <p className="text-center text-base text-cyan-400">
                        {personalBests.bestWeight.weight} {weightUnit}
                      </p>
                      <p className="text-center text-gray-500 text-xs mt-1 font-body">
                        × {personalBests.bestWeight.reps}{" "}
                        {t("gym.exerciseCard.reps").toLowerCase()}
                      </p>
                    </div>

                    {/* Best Volume */}
                    <div
                      className="rounded-md px-2 py-3 border-[1.5px] border-gray-700"
                      style={{
                        background:
                          "linear-gradient(to bottom left, #1e3a8a, #0f172a, #0f172a)",
                      }}
                    >
                      <p className="text-center text-gray-400 text-xs mb-1 font-body">
                        {t("gym.exerciseHistory.bestVolume")}
                      </p>
                      <p className="text-center text-base text-cyan-400">
                        {personalBests.bestVolume.volume} {weightUnit}
                      </p>
                      <p className="text-center text-gray-500 text-xs mt-1 font-body">
                        {personalBests.bestVolume.weight} × {personalBests.bestVolume.reps}
                      </p>
                    </div>
                  </div>
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
                          set.rpe === "Failure"
                            ? "bg-red-500/15"
                            : set.rpe === "Warm-up"
                              ? "bg-blue-500/15"
                              : ""
                        }`}
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
