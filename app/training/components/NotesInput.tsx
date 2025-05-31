"use client";

import { russoOne } from "@/app/ui/fonts";
import { SquarePen } from "lucide-react";

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
  return (
    <div className="flex flex-col ">
      <div className="flex items-center">
        <label className={`${russoOne.className} text-gray-100 text-sm mb-1`}>
          {label}
        </label>
        <SquarePen className="text-gray-100 mb-2" />
      </div>
      <textarea
        className="text-md touch-pan-y p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500 text-gray-100 bg-slate-900 hover:border-blue-500 focus:outline-none focus:border-green-300 resize-none"
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
