"use client";

import { russoOne } from "@/app/ui/fonts";
import { SquarePen } from "lucide-react";
import clsx from "clsx";

type NotesInputProps = {
  notes: string;
  setNotes: (value: string) => void;
  placeholder: string;
  rows?: number;
  cols?: number;
  label?: string;
};

export default function NotesInput({
  notes,
  setNotes,
  placeholder,
  rows,
  cols,
  label,
}: NotesInputProps) {
  const shouldGrow = !rows && !cols;

  return (
    <div className={`flex flex-col ${shouldGrow ? "flex-1" : ""}`}>
      <div className="flex items-center">
        <label className={`${russoOne.className} text-sm text-gray-300 mb-1`}>
          {label}
        </label>
        <SquarePen size={18} className="text-gray-100 mb-2" />
      </div>
      <textarea
        className={clsx(
          "text-md touch-pan-y p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 bg-[linear-gradient(50deg,_#0f172a,_#1e293b,_#333333)] text-gray-100 hover:border-blue-500 focus:outline-none focus:border-green-300 resize-none",
          {
            "h-full": shouldGrow,
          },
        )}
        placeholder={placeholder}
        value={notes}
        autoComplete="off"
        spellCheck={false}
        rows={rows}
        cols={cols}
        onChange={(e) => setNotes(e.target.value)}
      />
    </div>
  );
}
