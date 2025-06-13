"use client";

import { russoOne } from "@/app/ui/fonts";
import NotesInput from "./NotesInput";
import DropdownMenu from "@/app/components/dropdownMenu";
import { Ellipsis, SquareX } from "lucide-react";
import { ExerciseEntry } from "@/types/session";
import SetInput from "./SetInput";
import ExerciseTypeSelect from "./ExerciseTypeSelect";

type ExerciseCardProps = {
  index: number;
  exercise: ExerciseEntry;
  input: { weight: string; reps: string; rpe: string };
  onUpdateExercise: (index: number, updated: ExerciseEntry) => void;
  onDeleteExercise: (index: number) => void;
  lastExerciseHistory: (index: number) => void;
  onInputChange: (
    index: number,
    field: "weight" | "reps" | "rpe",
    value: number | string
  ) => void;
  onAddSet: (index: number) => void;
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
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
}: ExerciseCardProps) {
  return (
    <div className="py-2 px-4">
      <div
        className={`${russoOne.className} flex items-center justify-between`}
      >
        <div className="flex flex-col">
          <span className="text-gray-100 text-lg">
            {index + 1}. {exercise.name}
          </span>
          <span className="text-sm text-gray-400">
            {exercise.equipment} / {exercise.muscle_group}
          </span>
        </div>

        <DropdownMenu button={<Ellipsis className="text-gray-100 " />}>
          <button
            className="border-b py-2 px-4"
            onClick={() => onDeleteExercise(index)}
          >
            Delete
          </button>
          <button
            className="py-2 px-4"
            onClick={() => lastExerciseHistory(index)}
          >
            History
          </button>
        </DropdownMenu>
      </div>

      <div className="my-4 ">
        <NotesInput
          label={`Notes for ${exercise.name}...`}
          notes={exercise.notes || ""}
          setNotes={(newNotes) => {
            onUpdateExercise(index, { ...exercise, notes: newNotes });
          }}
          rows={2}
          cols={35}
          placeholder="Add your notes here..."
        />
      </div>

      <table className={`${russoOne.className} w-full text-left text-gray-100`}>
        <thead>
          <tr className="text-gray-300 border-b">
            <th className="p-2 font-normal">Set</th>
            {isCardioExercise(exercise) ? (
              <>
                <th className="p-2 font-normal">Time (min)</th>
                <th className="p-2 font-normal">Rpe</th>
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
                  <td className="p-2">{set.weight} min</td>
                  <td className="p-2">{set.rpe}</td>
                </>
              ) : (
                <>
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{set.weight}</td>
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
            <div className="flex items-center gap-5">
              <SetInput
                placeholder="Time in min..."
                type="number"
                value={input.weight}
                onChange={(val) => onInputChange(index, "weight", val)}
              />
            </div>
            <ExerciseTypeSelect
              value={input.rpe}
              onChange={(val) => onInputChange(index, "rpe", val)}
            />
          </>
        ) : (
          <>
            <div className="flex items-center gap-5">
              <SetInput
                placeholder="Weight..."
                type="number"
                value={input.weight}
                onChange={(val) => onInputChange(index, "weight", val)}
              />
              <SetInput
                placeholder="Reps..."
                type="number"
                value={input.reps}
                onChange={(val) => onInputChange(index, "reps", val)}
              />
            </div>

            <ExerciseTypeSelect
              value={input.rpe}
              onChange={(val) => onInputChange(index, "rpe", val)}
            />
          </>
        )}
      </div>
      <div className="flex items-center justify-center gap-4 my-6">
        <button
          onClick={() => onAddSet(index)}
          className={`${russoOne.className} px-10 bg-blue-900 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
        >
          Add Set
        </button>
      </div>
    </div>
  );
}
