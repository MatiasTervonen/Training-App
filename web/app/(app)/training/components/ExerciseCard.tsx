"use client";

import DropdownMenu from "@/app/(app)/components/dropdownMenu";
import { Menu, SquareX } from "lucide-react";
import SetInput from "./SetInput";
import ExerciseTypeSelect from "./ExerciseTypeSelect";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { ExerciseEntry, ExerciseInput } from "../../types/session";
import toast from "react-hot-toast";
import SubNotesInput from "../../ui/SubNotesInput";

type ExerciseCardProps = {
  index: number;
  exercise: ExerciseEntry;
  input: ExerciseInput;
  onUpdateExercise: (index: number, updated: ExerciseEntry) => void;
  onDeleteExercise: (index: number) => void;
  lastExerciseHistory: (index: number) => void;
  onInputChange: (
    index: number,
    field: "weight" | "reps" | "rpe" | "time_min" | "distance_meters",
    value: number | string
  ) => void;
  onAddSet: (index: number) => void;
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
  onChangeExercise: (index: number) => void;
  mode?: "session";
};

const isCardioExercise = (exercise: ExerciseEntry) => {
  return exercise.main_group?.toLowerCase() === "cardio";
};

export default function ExerciseCard({
  index,
  exercise,
  input,
  onUpdateExercise,
  onDeleteExercise,
  onInputChange,
  onAddSet,
  onDeleteSet,
  lastExerciseHistory,
  onChangeExercise,
  mode,
}: ExerciseCardProps) {
  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  return (
    <div className="py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-gray-100 text-lg">
            {index + 1}. {exercise.name}
          </span>
          <span className="text-sm text-gray-400">
            {exercise.equipment} / {exercise.muscle_group}
          </span>
        </div>

        <DropdownMenu button={<Menu />}>
          <button
            className="border-b py-2 px-4 hover:bg-gray-600 hover:rounded-t"
            onClick={() => onDeleteExercise(index)}
          >
            Delete
          </button>
          <button
            className="py-2 px-4 border-b hover:bg-gray-600"
            onClick={() => lastExerciseHistory(index)}
          >
            History
          </button>
          <button
            className="py-2 px-4 hover:bg-gray-600 hover:rounded-b"
            onClick={() => onChangeExercise(index)}
          >
            Change
          </button>
        </DropdownMenu>
      </div>

      {mode === "session" && (
        <>
          <div className="my-4 ">
            <SubNotesInput
              label={`Notes for ${exercise.name}...`}
              notes={exercise.notes || ""}
              setNotes={(newNotes) => {
                onUpdateExercise(index, { ...exercise, notes: newNotes });
              }}
              placeholder="Add your notes here..."
            />
          </div>

          <table className="w-full text-left text-gray-100">
            <thead>
              <tr className="text-gray-300 border-b">
                <th className="p-2 font-normal">Set</th>
                {isCardioExercise(exercise) ? (
                  <>
                    <th className="p-2 font-normal">Time (min)</th>
                    <th className="p-2 font-normal">Length (meters)</th>
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
              {exercise.sets.map((set, i) => (
                <tr
                  key={i}
                  className={`border-b ${
                    set.rpe === "Failure" ? "bg-red-800" : ""
                  } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                >
                  {isCardioExercise(exercise) ? (
                    <>
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{set.time_min}</td>
                      <td className="p-2">{set.distance_meters}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">
                        {set.weight} {weightUnit}
                      </td>
                      <td className="p-2">{set.reps}</td>
                      <td className="p-2">{set.rpe}</td>
                    </>
                  )}

                  <td>
                    <button
                      className="bg-red-600 p-1 rounded text-gray-100 "
                      onClick={() => {
                        const confirmed = window.confirm(
                          "Are you sure you want to delete this set?"
                        );
                        if (!confirmed) return;
                        onDeleteSet(index, i);
                      }}
                    >
                      <SquareX />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-center gap-4 mt-6">
            {isCardioExercise(exercise) ? (
              <>
                <div className="flex items-center gap-2 w-2/4">
                  <SetInput
                    placeholder="Time in min..."
                    type="number"
                    value={input.time_min ?? ""}
                    onChange={(e) =>
                      onInputChange(index, "time_min", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center gap-5 w-2/4">
                  <SetInput
                    placeholder="Length (meters)"
                    type="number"
                    value={input.distance_meters ?? ""}
                    onChange={(e) =>
                      onInputChange(index, "distance_meters", e.target.value)
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 w-2/3">
                  <SetInput
                    placeholder="Weight..."
                    type="number"
                    value={input.weight ?? ""}
                    onChange={(e) =>
                      onInputChange(index, "weight", e.target.value)
                    }
                  />
                  <SetInput
                    placeholder="Reps..."
                    type="number"
                    value={input.reps ?? ""}
                    onChange={(e) =>
                      onInputChange(index, "reps", e.target.value)
                    }
                  />
                </div>
                <div className="w-1/3">
                  <ExerciseTypeSelect
                    value={input.rpe!}
                    onChange={(val) => onInputChange(index, "rpe", val)}
                    options={[
                      { value: "Warm-up", label: "Warm-up" },
                      { value: "Easy", label: "Easy" },
                      { value: "Medium", label: "Medium" },
                      { value: "Hard", label: "Hard" },
                      { value: "Failure", label: "Failure" },
                    ]}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 my-6">
            <button
              onClick={() => {
                if (isCardioExercise(exercise)) {
                  const isTimeEmpty =
                    !input.time_min || input.time_min.trim() === "";

                  if (isTimeEmpty) {
                    toast.error("Missing data, please fill time (min).");
                    return;
                  }
                } else {
                  const isRepsEmpty = !input.reps || input.reps.trim() === "";

                  if (isRepsEmpty) {
                    toast.error("Missing data, please fill reps.");
                    return;
                  }
                }

                onAddSet(index);
              }}
              className="px-10 bg-blue-900 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200"
            >
              Add Set
            </button>
          </div>
        </>
      )}
    </div>
  );
}
