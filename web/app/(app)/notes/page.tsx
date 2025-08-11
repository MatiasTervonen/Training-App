"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SaveButton from "@/app/(app)/ui/save-button";
import DeleteSessionBtn from "../ui/deleteSessionBtn";
import ModalPageWrapper from "../components/modalPageWrapper";
import NotesInput from "../training/components/NotesInput";
import TitleInput from "../training/components/TitleInput";
import FullScreenLoader from "../components/FullScreenLoader";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { generateUUID } from "@/app/(app)/lib/generateUUID";
import { OptimisticNotes } from "@/app/(app)/types/session";
import { useDebouncedCallback } from "use-debounce";

type FeedItem = {
  table: "notes";
  item: OptimisticNotes;
  pinned: boolean;
};

export default function Notes() {
  const draft =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("notes_draft") || "null")
      : null;

  const [notes, setNotes] = useState(draft?.notes || "");
  const [notesTitle, setNotesTitle] = useState(draft?.title || "");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const didNavigate = useRef(false);

  const saveNotes = async () => {
    if (notes.length === 0) return;
    setIsSaving(true); // Start saving

    const optimisticNotes: FeedItem = {
      table: "notes",
      pinned: false,
      item: {
        id: generateUUID(),
        title: notesTitle,
        notes,
        created_at: new Date().toISOString(),
      },
    };

    mutate(
      "/api/feed",
      (prev: FeedItem[] = []) => [optimisticNotes, ...prev],
      false
    );

    try {
      const res = await fetch("/api/notes/save-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: notesTitle,
          notes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save notes");
      }

      await res.json();
      didNavigate.current = true;
      router.push("/dashboard");
      resetNotes();
      mutate("/api/feed");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes. Please try again.");
      mutate(
        "/api/feed",
        (prev: FeedItem[] = []) => {
          return prev.filter(
            (item) => item.item.id !== optimisticNotes.item.id
          );
        },
        false
      );
    } finally {
      if (!didNavigate.current) {
        setIsSaving(false);
      }
    }
  };

  const saveDraft = useDebouncedCallback(() => {
    if (notes.trim().length === 0 && notesTitle.trim().length === 0) {
      localStorage.removeItem("notes_draft");
    } else {
      const sessionDraft = {
        title: notesTitle,
        notes,
      };
      localStorage.setItem("notes_draft", JSON.stringify(sessionDraft));
    }
  }, 1000); // Save every second

  useEffect(() => {
    saveDraft();
  }, [notes, notesTitle, saveDraft]);

  const resetNotes = () => {
    localStorage.removeItem("notes_draft");
    setNotesTitle("");
    setNotes("");
  };

  return (
    <>
      <ModalPageWrapper noTopPadding>
        <div className="flex flex-col h-full w-full px-6 max-w-md mx-auto pb-10">
          <div className="flex flex-col items-center mt-5 gap-5 flex-grow mb-10 h-full">
            <p className="text-gray-100 text-lg text-center">
              Add your notes here
            </p>
            <div className="mb-5">
              <TitleInput
                title={notesTitle}
                setTitle={setNotesTitle}
                placeholder="Notes title..."
                label="Title..."
              />
            </div>
            <div className="flex w-full flex-grow">
              <NotesInput
                notes={notes}
                setNotes={setNotes}
                placeholder="Write your notes here..."
                label="Notes..."
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-5 mb-10  self-center w-full">
            <SaveButton onClick={saveNotes} />
            <DeleteSessionBtn onDelete={resetNotes} />
          </div>
        </div>
      </ModalPageWrapper>
      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
