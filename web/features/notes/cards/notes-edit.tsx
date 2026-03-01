"use client";

import { useState, useEffect, useCallback } from "react";
import SaveButton from "@/components/buttons/save-button";
import FullScreenLoader from "@/components/FullScreenLoader";
import toast from "react-hot-toast";
import { editNotes } from "@/database/notes/edit-notes";
import { FeedItemUI } from "@/types/session";
import TiptapEditor from "@/features/notes/components/TiptapEditor";
import type { UploadedImage } from "@/features/notes/components/TiptapEditor";
import TitleInput from "@/ui/TitleInput";
import FolderPicker from "@/features/notes/components/FolderPicker";
import useFolders from "@/features/notes/hooks/useFolders";
import { Dot } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  note: FeedItemUI;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

type NotesPayload = {
  notes: string;
  folder_id?: string | null;
};

export default function EditNotes({ note, onSave, onDirtyChange }: Props) {
  const { t } = useTranslation("notes");
  const payload = note.extra_fields as unknown as NotesPayload;

  const [title, setValue] = useState(note.title);
  const [notes, setNotes] = useState(payload.notes);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    payload.folder_id ?? null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);

  const { folders, isLoading: foldersLoading } = useFolders();

  const handleImagesChange = useCallback((images: UploadedImage[]) => {
    setNewImages(images);
  }, []);

  const handleSubmit = async () => {
    setIsSaving(true);
    const updated = new Date().toISOString();
    try {
      const updatedFeedItem = await editNotes({
        id: note.source_id,
        title,
        notes,
        updated_at: updated,
        folderId: selectedFolderId,
        newImages: newImages.length > 0 ? newImages : undefined,
      });

      onSave(updatedFeedItem as FeedItemUI);
    } catch {
      setIsSaving(false);
      toast.error(t("notes.editScreen.errorTitle"));
    }
  };

  const hasChanges =
    title !== note.title ||
    notes !== payload.notes ||
    selectedFolderId !== (payload.folder_id ?? null) ||
    newImages.length > 0;

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  return (
    <>
      {hasChanges && (
        <div className="bg-slate-900 z-50 py-1 px-4 flex items-center rounded-lg fixed top-5 self-start ml-5">
          <p className="text-sm text-yellow-500">
            {hasChanges ? t("notes.editScreen.unsavedChanges") : ""}
          </p>
          <div className="animate-pulse">
            <Dot color="#eab308" />
          </div>
        </div>
      )}
      <div className="flex flex-col h-full max-w-3xl mx-auto page-padding">
        <div className="flex flex-col items-center gap-5 grow min-h-0">
          <h2 className="text-lg text-center mb-5">
            {t("notes.editScreen.title")}
          </h2>
          <TitleInput
            value={title || ""}
            setValue={setValue}
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
            content={notes || ""}
            onChange={setNotes}
            onImagesChange={handleImagesChange}
            placeholder={t("notes.notesPlaceholder")}
            label={t("notes.notesLabel")}
          />
        </div>
        <div className="w-full mt-5">
          <SaveButton onClick={handleSubmit} />
        </div>
      </div>

      {isSaving && (
        <FullScreenLoader message={t("notes.editScreen.savingNotes")} />
      )}
    </>
  );
}
