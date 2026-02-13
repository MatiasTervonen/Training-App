import clsx from "clsx";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ModalSwipeBlocker } from "@/components/modal";

type NotesInputProps = {
  notes: string;
  setNotes: (value: string) => void;
  placeholder: string;
  rows?: number;
  cols?: number;
  label?: string;
  fillAvailableSpace?: boolean;
  minHeight?: number;
};

const DEFAULT_MIN_HEIGHT = 120;

export default function NotesInput({
  notes,
  setNotes,
  placeholder,
  rows,
  cols,
  label,
  fillAvailableSpace = false,
  minHeight = DEFAULT_MIN_HEIGHT,
}: NotesInputProps) {
  const { t } = useTranslation("common");
  const shouldGrow = !rows && !cols;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!shouldGrow || !textareaRef.current || fillAvailableSpace) return;
    textareaRef.current.style.height = "auto";
    const newHeight = Math.max(minHeight, textareaRef.current.scrollHeight);
    textareaRef.current.style.height = `${newHeight}px`;
  }, [notes, shouldGrow, fillAvailableSpace, minHeight]);

  return (
    <div
      className={clsx("flex flex-col w-full", {
        "flex-1": fillAvailableSpace,
      })}
    >
      <div className="flex items-center">
        <label className="text-sm text-gray-300 mb-1">{label}</label>
      </div>
      <ModalSwipeBlocker
        className={fillAvailableSpace ? "flex-1 flex flex-col" : undefined}
      >
        <textarea
          ref={textareaRef}
          className={clsx(
            "w-full text-md touch-pan-y p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] text-gray-100 hover:border-blue-500 focus:outline-none focus:border-green-300 resize-none overflow-hidden",
            {
              "h-full flex-1": fillAvailableSpace,
            },
          )}
          style={shouldGrow && !fillAvailableSpace ? { minHeight } : undefined}
          placeholder={placeholder}
          value={notes}
          autoComplete="off"
          spellCheck={false}
          rows={rows}
          cols={cols}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={10000}
        />
      </ModalSwipeBlocker>
      {notes.length >= 10000 ? (
        <p className="text-yellow-400 mt-2">
          {t("common.charLimitReached", { max: 10000 })}
        </p>
      ) : null}
    </div>
  );
}
