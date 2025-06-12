"use client";

import { russoOne } from "@/app/ui/fonts";
import NotesInput from "./NotesInput";
import DropdownMenu from "@/app/components/dropdownMenu";
import { Ellipsis, SquareX, ChevronDown } from "lucide-react";

type ExerciseSet = { weight?: number; reps?: number; rpe?: string };
type ExerciseEntry = {
  exercise_id: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  groupId?: string;
  equipment: string;
  main_group?: string;
  muscle_group?: string;
};

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
    <div className="bg-slate-900 py-2 px-4 rounded-md shadow-xl border-2 border-gray-500">
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
          className="bg-slate-800"
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
              <input
                className="text-lg  p-2 rounded-md border-2 border-gray-100 z-10 w-full  placeholder-gray-500 text-gray-100 bg-gray-800 hover:border-blue-500 focus:outline-none focus:border-green-300"
                placeholder="Time in min..."
                type="number"
                value={input.weight}
                onChange={(e) => onInputChange(index, "weight", e.target.value)}
              />
            </div>
            <div className="relative w-2/3">
              <select
                className="appearance-none text-lg p-2 rounded-md border-2 border-gray-100 z-10 w-full  placeholder-gray-500  text-gray-100 bg-gray-800 hover:border-blue-500 focus:outline-none focus:border-green-300"
                value={input.rpe}
                onChange={(e) => onInputChange(index, "rpe", e.target.value)}
              >
                <option value="Warm-up">Warm-up</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Failure">Failure</option>
              </select>
              <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none bg-slate-800 my-2 px-2">
                <ChevronDown className="text-gray-100" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-5">
              <input
                className="text-lg  p-2 rounded-md border-2 border-gray-100 z-10 w-full  placeholder-gray-500 text-gray-100 bg-gray-800 hover:border-blue-500 focus:outline-none focus:border-green-300"
                placeholder="Weight..."
                type="number"
                value={input.weight}
                onChange={(e) => onInputChange(index, "weight", e.target.value)}
              />
              <input
                className="text-lg  p-2 rounded-md border-2 border-gray-100 z-10 w-full  placeholder-gray-500 text-gray-100 bg-gray-800 hover:border-blue-500 focus:outline-none focus:border-green-300"
                placeholder="Reps..."
                type="number"
                value={input.reps}
                onChange={(e) => onInputChange(index, "reps", e.target.value)}
              />
            </div>
            <div className="relative w-2/3">
              <select
                className="appearance-none text-lg p-2 rounded-md border-2 border-gray-100 z-10 w-full  placeholder-gray-500  text-gray-100 bg-gray-800 hover:border-blue-500 focus:outline-none focus:border-green-300"
                value={input.rpe}
                onChange={(e) => onInputChange(index, "rpe", e.target.value)}
              >
                <option value="Warm-up">Warm-up</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Failure">Failure</option>
              </select>
              <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none bg-slate-800 my-2 px-2">
                <ChevronDown className="text-gray-100" />
              </div>
            </div>
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
