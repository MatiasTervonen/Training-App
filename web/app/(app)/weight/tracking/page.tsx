"use client";

import SaveButton from "@/components/buttons/save-button";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import { useState, useEffect } from "react";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useRouter } from "next/navigation";
import { formatDateShort } from "@/lib/formatDate";
import toast from "react-hot-toast";
import { saveWeight } from "@/database/weight/save-weight";
import TitleInput from "@/ui/TitleInput";
import SubNotesInput from "@/ui/SubNotesInput";
import { useQueryClient } from "@tanstack/react-query";
import CustomInput from "@/ui/CustomInput";
import { useTranslation } from "react-i18next";

export default function WorkoutAnalyticsPage() {
  const { t } = useTranslation("weight");
  const now = formatDateShort(new Date());

  const [weightTitle, setWeightTitle] = useState(
    `${t("weight.defaultTitle")} - ${now}`,
  );
  const [weightNotes, setWeightNotes] = useState("");
  const [weight, setWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  const queryClient = useQueryClient();

  useEffect(() => {
    const draft = localStorage.getItem("weight_draft");
    if (draft) {
      const {
        title: savedWeightTitle,
        notes: savedWeightNotes,
        weight: savedWeight,
      } = JSON.parse(draft);
      if (savedWeightTitle) setWeightTitle(savedWeightTitle);
      if (savedWeightNotes) setWeightNotes(savedWeightNotes);
      if (savedWeight) setWeight(savedWeight);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (weight.trim().length === 0 && weightNotes.trim().length === 0) {
      localStorage.removeItem("weight_draft");
    } else {
      const sessionDraft = {
        title: weightTitle,
        notes: weightNotes,
        weight,
      };
      localStorage.setItem("weight_draft", JSON.stringify(sessionDraft));
    }
  }, [weightTitle, weightNotes, weight, isLoaded]);

  const resetWeight = () => {
    localStorage.removeItem("weight_draft");
    setWeightTitle("");
    setWeightNotes("");
    setWeight("");
  };

  const handleSaveWeight = async () => {
    const parsedWeight = Number(weight);

    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      toast.error(t("weight.invalidWeight"));
      return;
    }

    setIsSaving(true);

    try {
      await saveWeight({
        title: weightTitle,
        notes: weightNotes,
        weight: parsedWeight,
      });

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["feed"], exact: true }),
        queryClient.refetchQueries({ queryKey: ["get-weight"], exact: true }),
      ]);

      router.push("/dashboard");
      resetWeight();
    } catch {
      setIsSaving(false);
      toast.error(t("weight.saveError"));
    }
  };

  return (
    <div className="flex flex-col justify-between h-full max-w-md mx-auto pt-5 px-5 pb-10">
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl text-center mb-5">{t("weight.pageTitle")}</h1>
        <TitleInput
          value={weightTitle}
          setValue={setWeightTitle}
          placeholder={t("weight.titlePlaceholder")}
          label={t("weight.titleLabel")}
        />
        <SubNotesInput
          notes={weightNotes}
          setNotes={setWeightNotes}
          placeholder={t("weight.notesPlaceholder")}
          label={t("weight.notesLabel")}
        />
        <CustomInput
          label={t("weight.weightLabel")}
          type="number"
          inputMode="decimal"
          placeholder={t("weight.weightPlaceholder")}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>
      <div className="flex flex-row gap-5">
        <DeleteSessionBtn onDelete={resetWeight} />
        <SaveButton onClick={handleSaveWeight} />
      </div>
      {isSaving && <FullScreenLoader message={t("weight.savingWeight")} />}
    </div>
  );
}
