import ExerciseDropdown from "./ExerciseDropdown";
import { CircleX } from "lucide-react";
import { ExerciseEntry, emptyExerciseEntry } from "@/app/(app)/types/session";
import { generateUUID } from "@/app/(app)/lib/generateUUID";

interface Props {
  draftExercises: ExerciseEntry[];
  setDraftExercises: React.Dispatch<React.SetStateAction<ExerciseEntry[]>>;
  exerciseToChangeIndex: number | null;
  setExerciseToChangeIndex: (index: number | null) => void;
  exercises: ExerciseEntry[];
  setExercises: React.Dispatch<React.SetStateAction<ExerciseEntry[]>>;
  setIsExerciseModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ExerciseSelectorList({
  draftExercises,
  setDraftExercises,
  exerciseToChangeIndex,
  setExerciseToChangeIndex,
  exercises,
  setExercises,
  setIsExerciseModalOpen,
}: Props) {
  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] overflow-hidden">
      <div className="shrink-0">
        {draftExercises.map((exercise, index) => {
          const isLast = index === draftExercises.length - 1;
          const isEmpty = !exercise.name?.trim();
          if (isLast && isEmpty) return null;

          // All others: just show a summary
          return (
            <div
              key={index}
              className="bg-slate-700 text-gray-100 p-2 my-2 px-4 shadow flex justify-between mr-20 ml-0"
            >
              <div className="flex flex-col ">
                <p className="">{exercise.name}</p>
                <p className="text-sm text-gray-400">
                  {exercise.equipment} / {exercise.muscle_group}
                </p>
              </div>
              <button
                className="hover:text-red-500 cursor-pointer"
                onClick={() =>
                  setDraftExercises((prev) =>
                    prev.filter((_, i) => i !== index),
                  )
                }
              >
                <CircleX />
              </button>
            </div>
          );
        })}
      </div>

      {(() => {
        const lastIndex = draftExercises.length - 1;
        const last = draftExercises[lastIndex];
        if (!last || last.name?.trim()) return null;

        // Show dropdown only for the last, empty item
        return (
          <div className="flex-1 min-h-0">
            <ExerciseDropdown
              onSelect={(selected) => {
                const newExercise: ExerciseEntry = {
                  exercise_id: String(selected.id),
                  name: selected.name,
                  equipment: selected.equipment,
                  main_group: selected.main_group || "",
                  sets: [],
                  notes: "",
                  superset_id:
                    exerciseToChangeIndex !== null
                      ? exercises[exerciseToChangeIndex]?.superset_id ||
                        generateUUID()
                      : "",
                  muscle_group: selected.muscle_group || "",
                  template_id: "",
                  position: 0,
                };

                if (exerciseToChangeIndex !== null) {
                  // Update single exercise in session
                  const updated = [...exercises];
                  updated[exerciseToChangeIndex] = newExercise;
                  setExercises(updated);
                  setIsExerciseModalOpen(false);
                  setExerciseToChangeIndex(null);
                } else {
                  // Add new exercise to superset draft
                  setDraftExercises((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = newExercise;
                    return [...updated, emptyExerciseEntry]; // allow adding another
                  });
                }
              }}
            />
          </div>
        );
      })()}
    </div>
  );
}
