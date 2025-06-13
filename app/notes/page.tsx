"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { russoOne } from "@/app/ui/fonts";
import SaveButton from "@/app/ui/save-button";
import DeleteSessionBtn from "../ui/deleteSessionBtn";
import ModalPageWrapper from "../components/modalPageWrapper";
import NotesInput from "../training/components/NotesInput";
import TitleInput from "../training/components/TitleInput";
import FullScreenLoader from "../components/FullScreenLoader";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { generateUUID } from "@/lib/generateUUID";
import { OptimisticNotes } from "@/types/session";

type FeedItem = {
  table: "notes";
  item: OptimisticNotes;
  pinned: boolean;
};

export default function Notes() {
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesTitle, setNotesTitle] = useState("");
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
          type: "notes",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save notes");
      }

      await res.json();
      didNavigate.current = true;
      router.push("/");
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

  useEffect(() => {
    const interval = setInterval(() => {
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

    return () => clearInterval(interval);
  }, [notes, notesTitle]);

  const resetNotes = () => {
    localStorage.removeItem("notes_draft");
    setNotesTitle("");
    setNotes("");
  };

  useEffect(() => {
    const draft = localStorage.getItem("notes_draft");
    if (draft) {
      const { title: savedNotesTitle, notes: savedNotes } = JSON.parse(draft);
      if (savedNotes) setNotes(savedNotes);
      if (savedNotesTitle) setNotesTitle(savedNotesTitle);
    }
  }, []);

  return (
    <>
      <ModalPageWrapper
        onSwipeRight={() => router.back()}
        leftLabel="back"
        onSwipeLeft={() => router.back()}
        rightLabel="back"
      >
        <div className="flex flex-col h-full w-full px-6 max-w-md mx-auto pb-10">
          <div className="flex flex-col items-center mt-5 gap-5 flex-grow mb-10 h-full">
            <p
              className={`${russoOne.className} text-gray-100 text-lg text-center`}
            >
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
            <SaveButton isSaving={isSaving} onClick={saveNotes} />
            <DeleteSessionBtn
              storageKey={["notes_draft"]}
              onDelete={resetNotes}
            ></DeleteSessionBtn>
          </div>
        </div>
      </ModalPageWrapper>
      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
