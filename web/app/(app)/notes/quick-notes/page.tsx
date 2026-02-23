"use client";

import { useState } from "react";
import SaveButton from "@/components/buttons/save-button";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import TiptapEditor from "@/features/notes/components/TiptapEditor";
import FullScreenLoader from "@/components/FullScreenLoader";
import TitleInput from "@/ui/TitleInput";
import FolderPicker from "@/features/notes/components/FolderPicker";
import useSaveDraft from "@/features/notes/hooks/useSaveDraft";
import useSaveNotes from "@/features/notes/hooks/useSaveNotes";
import useFolders from "@/features/notes/hooks/useFolders";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "@/lib/formatDate";

export default function Notes() {
  const { t } = useTranslation("notes");
  const now = formatDateShort(new Date());

  const [title, setTitle] = useState(`${t("notes.title")} - ${now}`);
  const [notes, setNotes] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const { folders, isLoading: foldersLoading } = useFolders();

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
          <FolderPicker
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
            isLoading={foldersLoading}
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

              saveNotes(
                { title, notes, folderId: selectedFolderId },
                {
                  onSuccess: () => {
                    resetNotes();
                    setSelectedFolderId(null);
                  },
                }
              );
            }}
          />
        </div>
      </div>
      {isPending && <FullScreenLoader message={t("notes.savingNotes")} />}
    </>
  );
}
