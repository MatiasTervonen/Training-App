"use client";

import { useState } from "react";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { editWeight } from "../../database/weight";
import { weight } from "../../types/models";
import SubNotesInput from "../SubNotesInput";
import TitleInput from "../TitleInput";

type Props = {
  weight: weight;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditWeight({ weight, onClose, onSave }: Props) {
  const [title, setValue] = useState(weight.title);
  const [notes, setNotes] = useState(weight.notes);
  const [weightValue, setWeightValue] = useState(weight.weight ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    const parsedWeight = Number(weightValue);

    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      toast.error("Please enter a valid weight value");
      return;
    }

    setIsSaving(true);

    try {
      await editWeight({ id: weight.id, title, notes, weight: parsedWeight });

      await onSave?.();
      onClose();
    } catch {
      setIsSaving(false);
      toast.error("Failed to update weight session");
      mutate("/api/feed");
    }
  };

  return (
    <>
      <div className="flex flex-col w-full h-full max-w-lg mx-auto px-6 pt-10">
        <div className="flex flex-col justify-between h-full">
          <div className="flex flex-col gap-5">
            <h2 className="text-lg text-center mb-5">
              Edit your weight session
            </h2>
            <TitleInput
              value={title || ""}
              setValue={setValue}
              placeholder="Weight title..."
              label="Title..."
            />
            <SubNotesInput
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
                type="number"
                inputMode="decimal"
                value={weightValue}
                onChange={(e) => setWeightValue(Number(e.target.value))}
                placeholder="Enter your weight..."
                className="custom-input text-lg p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  text-gray-100 bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300"
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
