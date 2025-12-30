"use client";

import { useState } from "react";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { editWeight } from "@/app/(app)/database/weight/edit-weight";
import { FeedItemUI } from "@/app/(app)/types/session";
import SubNotesInput from "@/app/(app)/ui/SubNotesInput";
import TitleInput from "@/app/(app)/ui/TitleInput";
import CustomInput from "@/app/(app)/ui/CustomInput";

type Props = {
  weight: FeedItemUI;
  onClose: () => void;
  onSave: (updatedItem: FeedItemUI) => void;
};

type WeightPayload = {
  notes: string;
  weight: number;
};

export default function EditWeight({ weight, onClose, onSave }: Props) {
  const payload = weight.extra_fields as unknown as WeightPayload;

  const [title, setValue] = useState(weight.title);
  const [notes, setNotes] = useState(payload.notes);
  const [weightValue, setWeightValue] = useState(
    payload.weight?.toString() ?? ""
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
      const updatedFeedItem = await editWeight({
        id: weight.source_id,
        title,
        notes,
        weight: parsedWeight,
        updated_at: new Date().toISOString(),
      });

      onSave(updatedFeedItem as FeedItemUI);
      onClose();
    } catch {
      setIsSaving(false);
      toast.error("Failed to update weight session");
    }
  };

  return (
    <div className="flex flex-col justify-between h-full max-w-lg mx-auto page-padding">
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
