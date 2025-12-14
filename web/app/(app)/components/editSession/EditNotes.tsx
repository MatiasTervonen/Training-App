"use client";

import { useState } from "react";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { editNotes } from "../../database/notes";
import { notes } from "../../types/models";
import NotesInput from "@/app/(app)/ui/NotesInput";
import TitleInput from "../../ui/TitleInput";
import { Dot } from "lucide-react";

type Props = {
  note: notes;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditNotes({ note, onClose, onSave }: Props) {
  const [originalData] = useState(note);
  const [title, setValue] = useState(note.title);
  const [notes, setNotes] = useState(note.notes);
  const [isSaving, setIsSaving] = useState(false);

  const currentData = {
    ...originalData,
    title,
    notes,
  };

  const updated = new Date().toISOString();

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await editNotes({ id: note.id, title, notes, updated_at: updated });

      await onSave?.();
      onClose();
    } catch {
      setIsSaving(false);
      toast.error("Failed to update notes");
    }
  };

  const hasChanges =
    JSON.stringify(originalData) !== JSON.stringify(currentData);

  return (
    <>
      {hasChanges && (
        <div className="bg-slate-900 z-50 py-1 px-4 flex items-center rounded-lg fixed top-5 self-start ml-5">
          <p className="text-sm text-yellow-500">
            {hasChanges ? "unsaved changes" : ""}
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
            fillAvailableSpace
          />
          <div className="w-full mt-5">
            <SaveButton onClick={handleSubmit} />
          </div>
        </div>
      </div>

      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
