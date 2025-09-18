"use client";

import { useState } from "react";
import NotesInput from "@/app/(app)/training/components/NotesInput";
import TitleInput from "@/app/(app)/training/components/TitleInput";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { Feed_item } from "@/app/(app)/types/session";

type Props = {
  weight: Feed_item;
  onClose: () => void;
  onSave?: () => void;
};

type FeedItem = {
  table: "weight";
  item: Feed_item;
  pinned: boolean;
};

export default function EditWeight({ weight, onClose, onSave }: Props) {
  const [title, setTitle] = useState(weight.title);
  const [notes, setNotes] = useState(weight.notes);
  const [weightValue, setWeightValue] = useState(
    weight.weight != null ? weight.weight.toString() : ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);

    const parsedWeight = parseFloat(weightValue);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      toast.error("Please enter a valid weight value");
      setIsSaving(false);
      return;
    }

    mutate(
      "/api/feed",
      (currentData: FeedItem[] = []) => {
        return currentData.map((item) => {
          if (item.table === "weight" && item.item.id === weight.id) {
            return {
              ...item,
              item: {
                ...item.item,
                title,
                notes,
                weight: parsedWeight,
              },
            };
          }
          return item;
        });
      },
      false
    );

    try {
      const res = await fetch("/api/weight/edit-weight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: weight.id,
          title,
          notes,
          weight: parsedWeight,
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
      toast.error("Failed to update weight session");
      mutate("/api/feed");
      console.error("Failed to save weight session:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="h-full bg-slate-800 py-5 px-10">
        <div className="flex flex-col justify-between h-full max-w-md mx-auto">
          <div className="flex flex-col gap-10">
            <h2 className="text-gray-100 text-lg text-center">
              Edit your weight session
            </h2>
            <TitleInput
              title={title || ""}
              setTitle={setTitle}
              placeholder="Weight title..."
              label="Title..."
            />
            <NotesInput
              notes={notes || ""}
              setNotes={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
            />

            <label
              htmlFor="weight"
              className="flex flex-col gap-1 text-gray-300"
            >
              Weight...
              <input
                id="weight"
                type="text"
                inputMode="decimal"
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
                placeholder="Enter your weight..."
                className="text-lg p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  text-gray-100 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
              />
            </label>
          </div>
          <div className="w-full py-10">
            <SaveButton onClick={handleSubmit} />
          </div>
        </div>
      </div>

      {isSaving && <FullScreenLoader message="Saving weight..." />}
    </>
  );
}
