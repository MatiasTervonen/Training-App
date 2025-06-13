import React from "react";
import { ChevronDown } from "lucide-react";

type SelectProps = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export default function ExerciseTypeSelect({ value, onChange }: SelectProps) {
  return (
    <div className="relative w-2/3">
      <select
        className="appearance-none text-lg p-2 pr-10 rounded-md border-2 border-gray-100 z-10 w-full  placeholder-gray-500 text-gray-100 bg-[linear-gradient(50deg,_#0f172a,_#1e293b,_#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="Warm-up">Warm-up</option>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
        <option value="Failure">Failure</option>
      </select>
      <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none my-2 px-2 ml-1">
        <ChevronDown className="text-gray-100" />
      </div>
    </div>
  );
}
