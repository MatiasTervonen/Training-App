"use client";

import { useState } from "react";
import NotesInput from "@/app/(app)/training/components/NotesInput";
import TitleInput from "@/app/(app)/training/components/TitleInput";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { feed_view } from "@/app/(app)/types/session";

type Props = {
  note: feed_view;
  onClose: () => void;
  onSave?: () => void;
};

type FeedItem = {
  table: "notes";
  item: feed_view;
  pinned: boolean;
};

export default function EditNotes({ note, onClose, onSave }: Props) {
  const [title, setTitle] = useState(note.title);
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

      onSave?.();
      onClose();

      mutate("/api/feed");
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
      mutate("/api/feed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col mx-auto w-full h-full bg-slate-800 max-w-md ">
        <div className="flex flex-col items-center gap-5 mx-6 mt-5 h-full ">
          <h2 className="text-gray-100 text-lg text-center">Edit your notes</h2>
          <div>
            <TitleInput
              title={title || ""}
              setTitle={setTitle}
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
          <div className="w-full">
            <SaveButton onClick={handleSubmit} />
          </div>
        </div>
      </div>

      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
