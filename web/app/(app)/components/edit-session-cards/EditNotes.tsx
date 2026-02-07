"use client";

import { useState, useEffect } from "react";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { editNotes } from "@/app/(app)/database/notes/edit-notes";
import { FeedItemUI } from "@/app/(app)/types/session";
import NotesInput from "@/app/(app)/ui/NotesInput";
import TitleInput from "@/app/(app)/ui/TitleInput";
import { Dot } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  note: FeedItemUI;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

type NotesPayload = {
  notes: string;
};

export default function EditNotes({ note, onSave, onDirtyChange }: Props) {
  const { t } = useTranslation("common");
  const payload = note.extra_fields as unknown as NotesPayload;

  const [title, setValue] = useState(note.title);
  const [notes, setNotes] = useState(payload.notes);
  const [isSaving, setIsSaving] = useState(false);

  const updated = new Date().toISOString();

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const updatedFeedItem = await editNotes({
        id: note.source_id,
        title,
        notes,
        updated_at: updated,
      });

      onSave(updatedFeedItem as FeedItemUI);
    } catch {
      setIsSaving(false);
      toast.error("Failed to update notes");
    }
  };

  const hasChanges = title !== note.title || notes !== payload.notes;

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  return (
    <>
      {hasChanges && (
        <div className="bg-slate-900 z-50 py-1 px-4 flex items-center rounded-lg fixed top-5 self-start ml-5">
          <p className="text-sm text-yellow-500">
            {hasChanges ? t("common.unsavedChanges") : ""}
          </p>
          <div className="animate-pulse">
            <Dot color="#eab308" />
          </div>
        </div>
      )}
      <div className="flex flex-col h-full max-w-lg mx-auto page-padding">
        <div className="flex flex-col items-center grow gap-5">
          <h2 className="text-lg text-center mb-5">Edit your notes</h2>
          <TitleInput
            value={title || ""}
            setValue={setValue}
            placeholder="Notes title..."
            label="Title..."
          />
          <NotesInput
            notes={notes || ""}
            setNotes={setNotes}
            placeholder="Write your notes here..."
            label="Notes..."
          />
        </div>
        <div className="w-full mt-5">
          <SaveButton onClick={handleSubmit} />
        </div>
      </div>

      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
