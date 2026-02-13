"use client";

import { useState } from "react";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import DeleteSessionBtn from "@/app/(app)/components/buttons/deleteSessionBtn";
import TiptapEditor from "@/app/(app)/notes/components/TiptapEditor";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import TitleInput from "@/app/(app)/ui/TitleInput";
import useSaveDraft from "@/app/(app)/notes/hooks/useSaveDraft";
import useSaveNotes from "@/app/(app)/notes/hooks/useSaveNotes";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "../../lib/formatDate";

export default function Notes() {
  const { t } = useTranslation("notes");
  const now = formatDateShort(new Date());

  const [title, setTitle] = useState(`${t("notes.title")} - ${now}`);
  const [notes, setNotes] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // useSaveDraft hook to save draft notes

  useSaveDraft({
    title,
    notes,
    setTitle,
    setNotes,
    setIsLoaded,
    isLoaded,
  });

  const resetNotes = () => {
    localStorage.removeItem("notes_draft");
    setTitle("");
    setNotes("");
  };

  // useSaveNotes hook to save notes
  const { mutate: saveNotes, isPending } = useSaveNotes();

  return (
    <>
      <div className="flex flex-col h-full max-w-3xl mx-auto page-padding">
        <div className="flex flex-col items-center gap-5 grow min-h-0 mb-10">
          <p className="text-lg text-center">{t("notes.addNotesHere")}</p>
          <TitleInput
            value={title}
            setValue={setTitle}
            placeholder={t("notes.titlePlaceholder")}
            label={t("notes.titleLabel")}
          />
          <TiptapEditor
            content={notes}
            onChange={setNotes}
            placeholder={t("notes.notesPlaceholder")}
            label={t("notes.notesLabel")}
          />
        </div>
        <div className="flex  items-center gap-5">
          <DeleteSessionBtn onDelete={resetNotes} />
          <SaveButton
            onClick={() => {
              if (notes.trim().length === 0) return;

              saveNotes({ title, notes });
              resetNotes();
            }}
          />
        </div>
      </div>
      {isPending && <FullScreenLoader message={t("notes.savingNotes")} />}
    </>
  );
}
