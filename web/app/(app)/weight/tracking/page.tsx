"use client";

import SaveButton from "@/app/(app)/components/buttons/save-button";
import DeleteSessionBtn from "@/app/(app)/components/buttons/deleteSessionBtn";
import { useState, useEffect } from "react";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { useRouter } from "next/navigation";
import { formatDate } from "@/app/(app)/lib/formatDate";
import toast from "react-hot-toast";
import { saveWeight } from "@/app/(app)/database/weight/save-weight";
import TitleInput from "@/app/(app)/ui/TitleInput";
import SubNotesInput from "@/app/(app)/ui/SubNotesInput";
import { useQueryClient } from "@tanstack/react-query";
import CustomInput from "@/app/(app)/ui/CustomInput";

export default function WorkoutAnalyticsPage() {
  const now = formatDate(new Date());

  const [weightTitle, setWeightTitle] = useState(`Weight - ${now}`);
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
      toast.error("Please enter a valid weight value");
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
      toast.error("Failed to save weight session. Please try again.");
    }
  };

  return (
    <div className="flex flex-col justify-between h-full max-w-md mx-auto pt-5 px-5 pb-10">
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl text-center mb-5">Track your body weight</h1>
        <TitleInput
          value={weightTitle}
          setValue={setWeightTitle}
          placeholder="Weight entry title..."
          label="Title for Weight..."
        />
        <SubNotesInput
          notes={weightNotes}
          setNotes={setWeightNotes}
          placeholder="Enter your notes here..."
          label="Notes for Weight..."
        />
        <CustomInput
          label="Weight..."
          type="number"
          inputMode="decimal"
          placeholder="Enter your weight here..."
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>
      <div className="flex flex-col items-center gap-5">
        <SaveButton onClick={handleSaveWeight} />
        <DeleteSessionBtn onDelete={resetWeight} />
      </div>
      {isSaving && <FullScreenLoader message="Saving weight..." />}
    </div>
  );
}
