"use client";

import { russoOne } from "@/app/ui/fonts";

type ExerciseInputProps = {
  setExerciseName: (value: string) => void;
  placeholder: string;
  exerciseName: string;
  label: number;
};


export default function Exerciseinput({
  setExerciseName,
  placeholder,
  exerciseName,
  label,
}: ExerciseInputProps) {
  return (
    <>
      <div className="flex items-center gap-3">
        <label className={`${russoOne.className} text-gray-100 text-xl`}>
          {label}.
        </label>
        <input
          className="text-lg p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 text-gray-100 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
          type="text"
          value={exerciseName}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => setExerciseName(e.target.value)}
          spellCheck={false}
        />
      </div>
    </>
  );
}
