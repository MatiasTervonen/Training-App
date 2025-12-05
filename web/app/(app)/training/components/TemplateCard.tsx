"use client";

import DropdownMenu from "@/app/(app)/components/dropdownMenu";
import { Menu } from "lucide-react";
import { ExerciseEntry } from "../../types/session";

type ExerciseCardProps = {
  index: number;
  exercise: ExerciseEntry;
  onUpdateExercise: (index: number, updated: ExerciseEntry) => void;
  onDeleteExercise: (index: number) => void;
  lastExerciseHistory: (index: number) => void;
  onChangeExercise: (index: number) => void;
};

export default function TemplateCard({
  index,
  exercise,
  onDeleteExercise,
  lastExerciseHistory,
  onChangeExercise,
}: ExerciseCardProps) {
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
    </div>
  );
}
