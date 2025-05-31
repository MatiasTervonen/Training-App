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
      <div className="flex flex-col w-full  bg-slate-800 ">
        <div className="flex flex-col gap-10 mx-10 mt-10">
          <h2
            className={`${russoOne.className} text-gray-100 font-bold text-lg text-center 
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
          <div>
            <NotesInput
              notes={notes}
              setNotes={setNotes}
              placeholder="Write your notes here..."
              rows={6}
              cols={10}
              label="Notes..."
            />
          </div>
          <SaveButton isSaving={isSaving} onClick={handleSubmit} />
        </div>
      </div>

      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
