"use client";

import { useState, useEffect } from "react";
import SaveButton from "@/components/buttons/save-button";
import FullScreenLoader from "@/components/FullScreenLoader";
import toast from "react-hot-toast";
import { editWeight } from "@/database/weight/edit-weight";
import { FeedItemUI } from "@/types/session";
import SubNotesInput from "@/ui/SubNotesInput";
import TitleInput from "@/ui/TitleInput";
import CustomInput from "@/ui/CustomInput";
import { Dot } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  weight: FeedItemUI;
  onClose: () => void;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

type WeightPayload = {
  notes: string;
  weight: number;
};

export default function EditWeight({ weight, onClose, onSave, onDirtyChange }: Props) {
  const { t } = useTranslation("common");
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

  const hasChanges =
    title !== weight.title ||
    notes !== payload.notes ||
    weightValue !== (payload.weight?.toString() ?? "");

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  return (
    <>
      {hasChanges && (
        <div className="bg-slate-900 z-50 py-1 px-4 flex items-center rounded-lg fixed top-5 self-start ml-5">
          <p className="text-sm text-yellow-500">{t("common.unsavedChanges")}</p>
          <div className="animate-pulse">
            <Dot color="#eab308" />
          </div>
        </div>
      )}
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
    </>
  );
}
