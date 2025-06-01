"use client";

import { useState } from "react";
import NotesInput from "@/app/training/components/NotesInput";
import TitleInput from "@/app/training/components/TitleInput";
import SaveButton from "@/app/ui/save-button";
import FullScreenLoader from "@/app/components/FullScreenLoader";
import { russoOne } from "@/app/ui/fonts";
import { Notes } from "@/types/session";

type Props = {
  note: Notes;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditNotes({ note, onClose, onSave }: Props) {
  const [title, setTitle] = useState(note.title);
  const [notes, setNotes] = useState(note.notes);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);

    const res = await fetch("/api/notes/edit-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: note.id,
        title,
        notes,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      console.error("Failed to save notes:", data.error);
      return;
    } else {
      setIsSaving(false);
      onSave?.();
      onClose();
    }

    setIsSaving(false);
  };

  return (
    <>
      <div className="flex flex-col mx-auto w-full h-full bg-slate-800 max-w-md ">
        <div className="flex flex-col items-center gap-5 mx-6 mt-5 h-full ">
          <h2
            className={`${russoOne.className} text-gray-100 text-lg text-center 
                            `}
          >
            Edit your notes
          </h2>
          <div>
            <TitleInput
              title={title}
              setTitle={setTitle}
              placeholder="Notes title..."
            />
          </div>
          <div className="flex w-full max-w-md flex-grow">
            <NotesInput
              notes={notes}
              setNotes={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
            />
          </div>
           <div className="w-full">
          <SaveButton isSaving={isSaving} onClick={handleSubmit} />
        </div>
        </div>
      </div>

      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
