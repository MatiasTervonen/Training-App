"use client";

import { useState } from "react";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { editNotes } from "../../database/notes";
import { notes } from "../../types/models";
import NotesInput from "@/app/(app)/ui/NotesInput";
import TitleInput from "../TitleInput";

type Props = {
  note: notes;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditNotes({ note, onClose, onSave }: Props) {
  const [title, setValue] = useState(note.title);
  const [notes, setNotes] = useState(note.notes);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await editNotes({ id: note.id, title, notes });

      await onSave?.();
      onClose();
    } catch {
      setIsSaving(false);
      toast.error("Failed to update notes");
    }
  };

  return (
    <>
      <div className="flex flex-col h-full px-5 max-w-md mx-auto pt-5">
        <div className="flex flex-col items-center grow gap-5">
          <h2 className="text-lg text-center">Edit your notes</h2>

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
