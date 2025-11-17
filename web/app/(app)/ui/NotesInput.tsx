import clsx from "clsx";
import { useEffect, useRef } from "react";

type NotesInputProps = {
  notes: string;
  setNotes: (value: string) => void;
  placeholder: string;
  rows?: number;
  cols?: number;
  label?: string;
  fillAvailableSpace?: boolean;
};

export default function NotesInput({
  notes,
  setNotes,
  placeholder,
  rows,
  cols,
  label,
  fillAvailableSpace = false,
}: NotesInputProps) {
  const shouldGrow = !rows && !cols;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!shouldGrow || !textareaRef.current || fillAvailableSpace) return;
    {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [notes, shouldGrow, fillAvailableSpace]);

  return (
    <div
      className={clsx("flex flex-col", {
        "flex-1": fillAvailableSpace,
      })}
    >
      <div className="flex items-center">
        <label className="text-sm text-gray-300 mb-1">{label}</label>
      </div>
      <textarea
        ref={textareaRef}
        className={clsx(
          "text-md touch-pan-y p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] text-gray-100 hover:border-blue-500 focus:outline-none focus:border-green-300 resize-none overflow-hidden",
          {
            "h-full flex-1": fillAvailableSpace,
          }
        )}
        placeholder={placeholder}
        value={notes}
        autoComplete="off"
        spellCheck={false}
        rows={rows}
        cols={cols}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={10000}
      />
      {notes.length >= 10000 ? (
        <p className="text-yellow-400 mt-2">
          Reached the limit (10000 chars max)
        </p>
      ) : null}
    </div>
  );
}
