"use client";

import { useState } from "react";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { editNotes } from "../../database/notes";
import { notes } from "../../types/models";
import NotesInput from "../SubNotesInput";
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
      <div className="flex flex-col mx-auto w-full h-full max-w-lg px-6 pt-10">
        <div className="flex flex-col items-center grow gap-5 h-full w-full">
          <h2 className="text-lg text-center mb-10">Edit your notes</h2>
          <div className="w-full">
            <TitleInput
              value={title || ""}
              setValue={setValue}
              placeholder="Notes title..."
              label="Title..."
            />
          </div>
          <div className="w-full flex-1 flex">
            <NotesInput
              notes={notes || ""}
              setNotes={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
              fillAvailableSpace
            />
          </div>
          <div className="w-full py-10">
            <SaveButton onClick={handleSubmit} />
          </div>
        </div>
      </div>

      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
