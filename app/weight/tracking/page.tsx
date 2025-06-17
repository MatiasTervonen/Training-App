"use client";

import { russoOne } from "@/app/ui/fonts";
import ModalPageWrapper from "@/app/components/modalPageWrapper";
import NotesInput from "@/app/training/components/NotesInput";
import TitleInput from "@/app/training/components/TitleInput";
import SaveButton from "@/app/ui/save-button";
import DeleteSessionBtn from "@/app/ui/deleteSessionBtn";
import { useState, useEffect, useRef } from "react";
import FullScreenLoader from "@/app/components/FullScreenLoader";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/formatDate";
import toast from "react-hot-toast";
import { mutate } from "swr";
import { OptimisticWeight } from "@/types/session";
import { generateUUID } from "@/lib/generateUUID";

type FeedItem = {
  table: "weight";
  item: OptimisticWeight;
  pinned: boolean;
};

export default function WorkoutAnalyticsPage() {
  const now = formatDate(new Date());

  const [weightTitle, setWeightTitle] = useState(`Weight - ${now}`);
  const [weightNotes, setWeightNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [weight, setWeight] = useState("");
  const didNavigate = useRef(false);

  const router = useRouter();

  useEffect(() => {
    if (weight.trim().length === 0 && weightTitle.trim().length === 0) {
      localStorage.removeItem("weight_draft");
    } else {
      const sessionDraft = {
        title: weightTitle,
        notes: weightNotes,
        weight,
      };
      localStorage.setItem("weight_draft", JSON.stringify(sessionDraft));
    }
  }, [weightTitle, weightNotes, weight]);

  const resetWeight = () => {
    localStorage.removeItem("weight_draft");
    setWeightTitle("");
    setWeightNotes("");
    setWeight("");
  };

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
  }, [weightTitle, weightNotes, weight]);

  const saveWeight = async () => {
    const parsedWeight = Number(weight);
    if (weight.length === 0 || isNaN(parsedWeight) || parsedWeight <= 0) {
      toast.error("Please enter a valid weight value");
      return;
    }
    setIsSaving(true); // Start saving

    const optimisticWeight: FeedItem = {
      table: "weight",
      pinned: false,
      item: {
        id: generateUUID(),
        title: weightTitle,
        notes: weightNotes,
        weight: parsedWeight,
        created_at: new Date().toISOString(),
      },
    };

    mutate(
      "/api/feed",
      (prev: FeedItem[] = []) => [optimisticWeight, ...prev],
      false
    );

    try {
      const res = await fetch("/api/weight/save-weight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: weightTitle,
          notes: weightNotes,
          weight: parsedWeight,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save weight session");
      }

      await res.json();
      didNavigate.current = true;
      router.push("/");
      resetWeight();
      mutate("/api/feed");
    } catch (error) {
      console.error("Error saving weight:", error);
      toast.error("Failed to save weight session. Please try again.");
      mutate(
        "/api/feed",
        (prev: FeedItem[] = []) => {
          return prev.filter(
            (item) => item.item.id !== optimisticWeight.item.id
          );
        },
        false
      );

      mutate("/api/feed");
    } finally {
      if (!didNavigate.current) {
        setIsSaving(false);
      }
    }
  };

  return (
    <ModalPageWrapper
      noTopPadding
      leftLabel="back"
      rightLabel="home"
      onSwipeLeft={() => router.push("/")}
      onSwipeRight={() => router.back()}
    >
      <div
        className={`${russoOne.className} h-full bg-slate-800 text-gray-100 py-5 px-10`}
      >
        <div className="flex flex-col justify-between h-full max-w-md mx-auto">
          <div className="flex flex-col gap-10">
            <h1 className="text-2xl text-center">Track your body weight</h1>

            <TitleInput
              title={weightTitle}
              setTitle={setWeightTitle}
              placeholder="Weight entry title..."
              label="Title for Weight..."
            />
            <NotesInput
              notes={weightNotes}
              setNotes={setWeightNotes}
              placeholder="Enter your notes here..."
              label="Notes for Weight..."
            />
            <label
              htmlFor="weight"
              className="flex flex-col gap-1 text-gray-400"
            >
              Weight...
              <input
                id="weight"
                type="text"
                inputMode="numeric"
                placeholder="Enter your weight here..."
                className="text-lg p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  text-gray-100 bg-[linear-gradient(50deg,_#0f172a,_#1e293b,_#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-col items-center gap-5">
            <SaveButton isSaving={isSaving} onClick={saveWeight} />
            <DeleteSessionBtn onDelete={resetWeight} />
          </div>
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving weight..." />}
    </ModalPageWrapper>
  );
}
