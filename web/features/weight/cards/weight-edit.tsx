"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { editWeight } from "@/database/weight/edit-weight";
import { FeedItemUI } from "@/types/session";
import SubNotesInput from "@/ui/SubNotesInput";
import TitleInput from "@/ui/TitleInput";
import CustomInput from "@/ui/CustomInput";
import { useAutoSave } from "@/hooks/useAutoSave";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import { useTranslation } from "react-i18next";

type Props = {
  weight: FeedItemUI;
  onClose: () => void;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

type WeightPayload = {
  notes: string;
  weight: number;
};

export default function EditWeight({ weight, onSave, onDirtyChange }: Props) {
  const { t } = useTranslation("weight");
  const payload = weight.extra_fields as unknown as WeightPayload;

  const [title, setValue] = useState(weight.title);
  const [notes, setNotes] = useState(payload.notes);
  const [weightValue, setWeightValue] = useState(
    payload.weight?.toString() ?? ""
  );

  const data = useMemo(
    () => ({ title, notes, weightValue }),
    [title, notes, weightValue]
  );

  const handleAutoSave = useCallback(
    async (saveData: { title: string; notes: string; weightValue: string }) => {
      const parsedWeight = Number(saveData.weightValue);

      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        toast.error(t("weight.invalidWeight"));
        throw new Error("Invalid weight value");
      }

      const updatedFeedItem = await editWeight({
        id: weight.source_id,
        title: saveData.title,
        notes: saveData.notes,
        weight: parsedWeight,
        updated_at: new Date().toISOString(),
      });

      onSave(updatedFeedItem as FeedItemUI);
    },
    [weight.source_id, onSave, t]
  );

  const { status, hasPendingChanges } = useAutoSave({
    data,
    onSave: handleAutoSave,
  });

  useEffect(() => {
    onDirtyChange?.(hasPendingChanges);
  }, [hasPendingChanges, onDirtyChange]);

  return (
    <>
      <AutoSaveIndicator status={status} />
      <div className="flex flex-col justify-between h-full max-w-lg mx-auto page-padding">
        <div className="flex flex-col gap-5">
          <h2 className="text-lg text-center mb-5">{t("weight.editTitle")}</h2>
          <TitleInput
            value={title || ""}
            setValue={setValue}
            placeholder={t("weight.titlePlaceholder")}
            label={t("weight.titleLabel")}
          />
          <SubNotesInput
            notes={notes || ""}
            setNotes={setNotes}
            placeholder={t("weight.notesPlaceholder")}
            label={t("weight.notesLabel")}
          />

          <CustomInput
            label={t("weight.weightLabel")}
            type="number"
            inputMode="decimal"
            placeholder={t("weight.weightPlaceholder")}
            value={weightValue}
            onChange={(e) => setWeightValue(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
