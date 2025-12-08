"use client";

import Modal from "@/app/(app)/components/modal";
import Spinner from "@/app/(app)/components/spinner";
import { formatDate } from "@/app/(app)/lib/formatDate";
import { HistoryResult } from "@/app/(app)/types/session";
import { useUserStore } from "../../lib/stores/useUserStore";

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
  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  const exerciseName = history?.[0]?.name;
  const equipment = history?.[0]?.equipment;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {isLoading ? (
        <div className="text-lg flex flex-col justify-center items-center mt-20 gap-5 mx-4">
          <p>Loading history</p>
          <Spinner size="w-[30px] h-[30px]" />
        </div>
      ) : error ? (
        <p className="text-center mt-20 mx-4">
          Could not load exercise history. Please try again.
        </p>
      ) : history.length === 0 ? (
        <p className="text-center mt-20 text-lg mx-4 ">
          No history available for this exercise.
        </p>
      ) : (
        <div className="px-6 max-w-lg mx-auto">
          <div className="flex flex-col mt-10 items-center rounded-md">
            <p className="text-lg">{exerciseName}</p>
            <p className="text-gray-300">{equipment}</p>
          </div>
          <div className="flex flex-col items-center mb-20">
            {history.map((session, sessionIndex) => (
              <div key={sessionIndex} className="w-full">
                <div className="flex flex-col items-center mt-10">
                  <p className="text-lg">{formatDate(session!.date)}</p>
                  <div className="mt-6  bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-md px-4 pb-5 pt-2 shadow-md w-full  border-2 border-gray-600">
                    <table className="w-full text-left ">
                      <thead>
                        <tr className="border-b">
                          {session?.main_group === "cardio" ? (
                            <>
                              <th className="p-2 font-normal">set</th>
                              <th className="p-2 font-normal">Time (min)</th>
                              <th className="p-2 font-normal">
                                Distance (meters)
                              </th>
                              <th className="p-2 font-normal"></th>
                            </>
                          ) : (
                            <>
                              <th className="p-2 font-normal">Set</th>
                              <th className="p-2 font-normal">Weight</th>
                              <th className="p-2 font-normal">Reps</th>
                              <th className="p-2 font-normal">Rpe</th>
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
                                <td className="p-2">{set.rpe}</td>
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
