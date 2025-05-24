"use client";

import { russoOne } from "@/app/ui/fonts";

type SuperSetInputProps = {
  index: number;
  value: string;
  onChange: (index: number, value: string) => void;
  placeholder: string;
  label: number;
};

export default function SuperSetInput({
  index,
  value,
  onChange,
  placeholder,
  label,
}: SuperSetInputProps) {
  return (
    <>
      <div className="flex items-center gap-3">
        <label className={`${russoOne.className} text-gray-100 text-xl`}>
          {label}.
        </label>
        <input
          className="text-lg p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 text-gray-100 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => onChange(index, e.target.value)}
          spellCheck={false}
        />
      </div>
    </>
  );
}
