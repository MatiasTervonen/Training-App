"use client";

import DropdownMenu from "@/components/dropdownMenu";
import { Menu } from "lucide-react";
import { ExerciseEntry } from "@/types/session";

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

        <DropdownMenu
          button={<Menu />}
          onDelete={() => onDeleteExercise(index)}
          onHistory={() => lastExerciseHistory(index)}
          onChange={() => onChangeExercise(index)}
        />
      </div>
    </div>
  );
}
