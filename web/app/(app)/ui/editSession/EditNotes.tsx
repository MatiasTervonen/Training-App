"use client";

import { useState } from "react";
import NotesInput from "@/app/(app)/ui/NotesInput";
import CustomInput from "@/app/(app)/ui/CustomInput";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { Feed_item } from "@/app/(app)/types/session";
import { handleError } from "../../utils/handleError";

type Props = {
  note: Feed_item;
  onClose: () => void;
  onSave?: () => void;
};

type FeedItem = {
  table: "notes";
  item: Feed_item;
  pinned: boolean;
};

export default function EditNotes({ note, onClose, onSave }: Props) {
  const [title, setValue] = useState(note.title);
  const [notes, setNotes] = useState(note.notes);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);

    mutate(
      "/api/feed",
      (currentData: FeedItem[] = []) => {
        return currentData.map((item) => {
          if (item.table === "notes" && item.item.id === note.id) {
            return {
              ...item,
              item: {
                ...item.item,
                title,
                notes,
              },
            };
          }
          return item;
        });
      },
      false
    );

    try {
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
        throw new Error("Failed to update weight session");
      }

      await res.json();

      await onSave?.();
      onClose();

      mutate("/api/feed");
    } catch (error) {
      handleError(error, {
        message: "Error editing notes",
        route: "/api/notes/edit-notes",
        method: "POST",
      });
      toast.error("Failed to update notes");
      mutate("/api/feed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col mx-auto w-full h-full bg-slate-800 max-w-lg">
        <div className="flex flex-col items-center gap-5 mx-6 mt-5 h-full ">
          <h2 className="text-gray-100 text-lg text-center">Edit your notes</h2>
          <div>
            <CustomInput
              value={title || ""}
              setValue={setValue}
              placeholder="Notes title..."
              label="Title..."
            />
          </div>
          <div className="flex w-full max-w-md flex-grow">
            <NotesInput
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
