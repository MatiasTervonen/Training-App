import { useEffect, useRef } from "react";
import { ModalSwipeBlocker } from "@/app/(app)/components/modal";

type NotesInputProps = {
  notes: string;
  setNotes: (value: string) => void;
  placeholder: string;
  rows?: number;
  cols?: number;
  label?: string;
};

export default function SubNotesInput({
  notes,
  setNotes,
  placeholder,
  rows,
  cols,
  label,
}: NotesInputProps) {
  const shouldGrow = !rows && !cols;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!shouldGrow || !textareaRef.current) return;
    {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [notes, shouldGrow]);

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center">
        <label className="text-sm text-gray-300 mb-1">{label}</label>
      </div>
      <ModalSwipeBlocker>
        <textarea
          ref={textareaRef}
          className="w-full text-md touch-pan-y p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300 resize-none overflow-hidden"
          placeholder={placeholder}
          value={notes}
          autoComplete="off"
          spellCheck={false}
          rows={rows}
          cols={cols}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
        />
      </ModalSwipeBlocker>
      {notes.length >= 500 ? (
        <p className="text-yellow-400 mt-2">
          Reached the limit (500 chars max)
        </p>
      ) : null}
    </div>
  );
}
