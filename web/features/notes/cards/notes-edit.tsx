"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { editNotes } from "@/database/notes/edit-notes";
import { FeedItemUI } from "@/types/session";
import TiptapEditor from "@/features/notes/components/TiptapEditor";
import type { UploadedImage } from "@/features/notes/components/TiptapEditor";
import TitleInput from "@/ui/TitleInput";
import FolderPicker from "@/features/notes/components/FolderPicker";
import useFolders from "@/features/notes/hooks/useFolders";
import { useTranslation } from "react-i18next";
import { useAutoSave } from "@/hooks/useAutoSave";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";

type Props = {
  note: FeedItemUI;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (dirty: boolean) => void;
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
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);

  const { folders, isLoading: foldersLoading } = useFolders();

  const newImagesRef = useRef<UploadedImage[]>([]);

  const handleImagesChange = useCallback((images: UploadedImage[]) => {
    newImagesRef.current = images;
    setNewImages(images);
  }, []);

  const handleAutoSave = useCallback(
    async (data: {
      title: string;
      notes: string;
      selectedFolderId: string | null;
      newImageCount: number;
    }) => {
      const updated = new Date().toISOString();
      const images = newImagesRef.current;
      try {
        const updatedFeedItem = await editNotes({
          id: note.source_id,
          title: data.title,
          notes: data.notes,
          updated_at: updated,
          folderId: data.selectedFolderId,
          newImages: images.length > 0 ? images : undefined,
        });

        onSave(updatedFeedItem as FeedItemUI);
      } catch {
        toast.error(t("notes.editScreen.errorTitle"));
        throw new Error("Save failed");
      }
    },
    [note.source_id, onSave, t],
  );

  const { status, hasPendingChanges } = useAutoSave({
    data: { title, notes, selectedFolderId, newImageCount: newImages.length },
    onSave: handleAutoSave,
  });

  useEffect(() => {
    onDirtyChange?.(hasPendingChanges);
  }, [hasPendingChanges, onDirtyChange]);

  return (
    <>
      <AutoSaveIndicator status={status} />
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
      </div>
    </>
  );
}
