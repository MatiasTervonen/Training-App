"use client";

import { russoOne } from "@/app/ui/fonts";
import Modal from "@/app/(app)/components/modal";
import Spinner from "@/app/(app)/components/spinner";
import { formatDate } from "@/app/(app)/lib/formatDate";
import { HistoryResult } from "@/app/(app)/types/session";

type ExerciseHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  history: HistoryResult[];
  noTopPadding?: boolean;
};

export default function ExerciseHistoryModal({
  isOpen,
  onClose,
  isLoading,
  history,
  noTopPadding,
}: ExerciseHistoryModalProps) {
  return (
    <Modal noTopPadding={noTopPadding} isOpen={isOpen} onClose={onClose}>
      {isLoading ? (
        <div
          className={`${russoOne.className} text-lg text-gray-100 flex flex-col justify-center items-center mt-20 gap-5 mx-4`}
        >
          <p>Loading history</p>
          <Spinner size={40} />
        </div>
      ) : history.length === 0 ? (
        <p className="text-center mt-20 text-lg mx-4 text-gray-100">
          No history available for this exercise.
        </p>
      ) : history ? (
        <div className="flex flex-col items-center">
          {history.map((session, sessionIndex) => (
            <div key={sessionIndex} className="mb-4 w-full">
              <div
                className={`${russoOne.className} text-gray-100 flex flex-col items-center mt-10 mx-4`}
              >
                <p className="text-lg">{formatDate(session.date)}</p>
                <div className="mt-6 bg-slate-900 rounded-md px-4 py-2 shadow-lg max-w-md w-full mx-auto">
                  <table className="w-full text-left ">
                    <thead>
                      <tr className="text-gray-100 border-b">
                        <th className="p-2 font-normal">Set</th>
                        <th className="p-2 font-normal">Weight</th>
                        <th className="p-2 font-normal">Reps</th>
                        <th className="p-2 font-normal">Rpe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.sets.map((set, setIndex) => (
                        <tr key={setIndex} className="mb-2">
                          <td className="p-2">{setIndex + 1}</td>
                          <td className="p-2">{set.weight}</td>
                          <td className="p-2">{set.reps}</td>
                          <td className="p-2">{set.rpe}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-100 text-center">No data found</p>
      )}
    </Modal>
  );
}
