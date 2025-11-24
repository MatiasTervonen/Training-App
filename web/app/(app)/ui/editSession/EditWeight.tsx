"use client";

import { useState } from "react";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { editWeight } from "../../database/weight";
import { weight } from "../../types/models";
import SubNotesInput from "../SubNotesInput";
import TitleInput from "../TitleInput";
import CustomInput from "../../ui/CustomInput";

type Props = {
  weight: weight;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditWeight({ weight, onClose, onSave }: Props) {
  const [title, setValue] = useState(weight.title);
  const [notes, setNotes] = useState(weight.notes);
  const [weightValue, setWeightValue] = useState(
    weight.weight?.toString() ?? ""
  );
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
    }
  };

  return (
    <div className="flex flex-col justify-between h-full max-w-lg mx-auto pt-5 px-4">
      <div className="flex flex-col gap-5">
        <h2 className="text-lg text-center mb-5">Edit your weight session</h2>
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

        <CustomInput
          label="Weight..."
          type="number"
          inputMode="decimal"
          placeholder="Enter your weight here..."
          value={weightValue}
          onChange={(e) => setWeightValue(e.target.value)}
        />
      </div>
      <div className="pt-10">
        <SaveButton onClick={handleSubmit} />
      </div>
      {isSaving && <FullScreenLoader message="Saving weight..." />}
    </div>
  );
}
