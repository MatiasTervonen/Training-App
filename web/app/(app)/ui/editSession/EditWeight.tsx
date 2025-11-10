"use client";

import { useState } from "react";
import NotesInput from "@/app/(app)/ui/NotesInput";
import CustomInput from "@/app/(app)/ui/CustomInput";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { handleError } from "../../utils/handleError";
import { editWeight } from "../../database/weight";
import { weight } from "../../types/models";

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
    } catch (error) {
      setIsSaving(false);
      handleError(error, {
        message: "Error editing weight session",
        route: "/api/weight/edit-weight",
        method: "POST",
      });
      toast.error("Failed to update weight session");
      mutate("/api/feed");
    }
  };

  return (
    <>
      <div className="flex flex-col w-full h-full mb-10 max-w-md mx-auto pt-15">
        <div className="flex flex-col gap-10">
          <h2 className="text-gray-100 text-lg text-center">
            Edit your weight session
          </h2>
          <CustomInput
            value={title || ""}
            setValue={setValue}
            placeholder="Weight title..."
            label="Title..."
          />
          <NotesInput
            notes={notes || ""}
            setNotes={setNotes}
            placeholder="Write your notes here..."
            label="Notes..."
          />

          <label htmlFor="weight" className="flex flex-col gap-1 text-gray-300">
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

      {isSaving && <FullScreenLoader message="Saving weight..." />}
    </>
  );
}
