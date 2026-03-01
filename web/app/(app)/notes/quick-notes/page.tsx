"use client";

import { useState, useCallback } from "react";
import SaveButton from "@/components/buttons/save-button";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import TiptapEditor from "@/features/notes/components/TiptapEditor";
import type { UploadedImage } from "@/features/notes/components/TiptapEditor";
import FullScreenLoader from "@/components/FullScreenLoader";
import TitleInput from "@/ui/TitleInput";
import FolderPicker from "@/features/notes/components/FolderPicker";
import useSaveDraft from "@/features/notes/hooks/useSaveDraft";
import useSaveNotes from "@/features/notes/hooks/useSaveNotes";
import useFolders from "@/features/notes/hooks/useFolders";
import { createClient } from "@/utils/supabase/client";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "@/lib/formatDate";

export default function Notes() {
  const { t } = useTranslation("notes");
  const now = formatDateShort(new Date());

  const [title, setTitle] = useState(`${t("notes.title")} - ${now}`);
  const [notes, setNotes] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const { folders, isLoading: foldersLoading } = useFolders();

  useSaveDraft({
    title,
    notes,
    images: uploadedImages,
    setTitle,
    setNotes,
    setImages: setUploadedImages,
    setIsLoaded,
    isLoaded,
  });

  const resetNotes = useCallback(async () => {
    // Clean up orphaned images from storage
    if (uploadedImages.length > 0) {
      const supabase = createClient();
      const paths = uploadedImages.map((img) => img.storage_path);
      await supabase.storage.from("notes-images").remove(paths);
    }
    localStorage.removeItem("notes_draft");
    setTitle("");
    setNotes("");
    setUploadedImages([]);
  }, [uploadedImages]);

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
            onImagesChange={setUploadedImages}
            placeholder={t("notes.notesPlaceholder")}
            label={t("notes.notesLabel")}
          />
        </div>
        <div className="flex items-center gap-5">
          <DeleteSessionBtn onDelete={resetNotes} />
          <SaveButton
            onClick={() => {
              if (notes.trim().length === 0) return;

              saveNotes(
                {
                  title,
                  notes,
                  folderId: selectedFolderId,
                  images: uploadedImages,
                },
                {
                  onSuccess: () => {
                    localStorage.removeItem("notes_draft");
                    setTitle("");
                    setNotes("");
                    setUploadedImages([]);
                    setSelectedFolderId(null);
                  },
                },
              );
            }}
          />
        </div>
      </div>
      {isPending && <FullScreenLoader message={t("notes.savingNotes")} />}
    </>
  );
}
