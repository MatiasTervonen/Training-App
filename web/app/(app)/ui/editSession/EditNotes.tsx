"use client";

import { useState } from "react";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { handleError } from "../../utils/handleError";
import { editNotes } from "../../database/notes";
import { notes } from "../../types/models";
import SubNotesInput from "../SubNotesInput";
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
    } catch (error) {
      setIsSaving(false);
      handleError(error, {
        message: "Error editing notes",
        route: "server-action: editNotes",
        method: "direct",
      });
      toast.error("Failed to update notes");
    }
  };

  return (
    <>
      <div className="flex flex-col mx-auto w-full h-full bg-slate-800 max-w-lg">
        <div className="flex flex-col items-center gap-5 mx-6 mt-5 h-full ">
          <h2 className="text-gray-100 text-lg text-center">Edit your notes</h2>
          <div className="w-full">
            <TitleInput
              value={title || ""}
              setValue={setValue}
              placeholder="Notes title..."
              label="Title..."
            />
          </div>
          <div className="flex w-full grow">
            <SubNotesInput
              notes={notes || ""}
              setNotes={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
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
