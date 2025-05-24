"use client";

import { russoOne } from "@/app/ui/fonts";
import NotesInput from "./NotesInput";
import DropdownMenu from "@/app/components/dropdownMenu";
import { Ellipsis, SquareX } from "lucide-react";

type ExerciseSet = { weight: string; reps: string; lvl: string };
type ExerciseEntry = {
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  groupId?: string;
};

type ExerciseCardProps = {
  index: number;
  exercise: ExerciseEntry;
  input: { weight: string; reps: string; lvl: string };
  onUpdateExercise: (index: number, updated: ExerciseEntry) => void;
  onDeleteExercise: (index: number) => void;
  onInputChange: (
    index: number,
    field: "weight" | "reps" | "lvl",
    value: string
  ) => void;
  onAddSet: (index: number) => void;
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
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
}: ExerciseCardProps) {
  return (
    <>
      <div className="relative flex items-center justify-between w-full gap-5  border-gray-100 ">
        <h2 className="text-xl font-bold text-gray-100 p-2">
          {index + 1}. {exercise.name}
        </h2>

        <DropdownMenu button={<Ellipsis className="text-gray-100" />}>
          <button onClick={() => onDeleteExercise(index)}>Delete</button>
        </DropdownMenu>
      </div>

      <div className="w-full my-4 flex flex-col">
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

      <table className="w-full text-left border-collapse text-gray-100 mb-4 ">
        <thead>
          <tr className="text-gray-300 border-b">
            <th className="p-2">Set</th>
            <th className="p-2">Weight</th>
            <th className="p-2">Reps</th>
            <th className="p-2">Lvl</th>
          </tr>
        </thead>
        <tbody>
          {exercise.sets.map((set, i) => (
            <tr
              key={i}
              className={`border-b ${
                set.lvl === "Failure" ? "bg-red-800" : ""
              } ${set.lvl === "Warm-up" ? "bg-blue-500" : ""}`}
            >
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{set.weight}</td>
              <td className="p-2">{set.reps}</td>
              <td className="p-2">{set.lvl}</td>
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
        <div className="flex items-center gap-5">
          <input
            className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[80px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
            placeholder="Weight..."
            type="number"
            value={input.weight}
            onChange={(e) => onInputChange(index, "weight", e.target.value)}
          />
          <input
            className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[80px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
            placeholder="Reps..."
            type="number"
            value={input.reps}
            onChange={(e) => onInputChange(index, "reps", e.target.value)}
          />
        </div>
        <select
          className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10 w-[100px]  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
          value={input.lvl}
          onChange={(e) => onInputChange(index, "lvl", e.target.value)}
        >
          <option value="Warm-up">Warm-up</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
          <option value="Failure">Failure</option>
        </select>
      </div>
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => onAddSet(index)}
          className={`${russoOne.className} px-10 bg-blue-900 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
        >
          Add Set
        </button>
      </div>
    </>
  );
}
