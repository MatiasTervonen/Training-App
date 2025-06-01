"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { russoOne } from "@/app/ui/fonts";
import SaveButton from "@/app/ui/save-button";
import DeleteSessionBtn from "../ui/deleteSessionBtn";
import ModalPageWrapper from "../components/modalPageWrapper";
import NotesInput from "../training/components/NotesInput";
import TitleInput from "../training/components/TitleInput";
import FullScreenLoader from "../components/FullScreenLoader";

export default function Notes() {
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesTitle, setNotesTitle] = useState("");
  const router = useRouter();

  const saveNotes = async () => {
    if (notes.length === 0) return;
    setIsSaving(true); // Start saving
    const response = await fetch("/api/notes/save-notes", {
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
    if (response.ok) {
      console.log("Session saved successfully!");
      resetNotes();
      router.push("/"); // Redirect to the finished page
    } else {
      console.error("Failed to save session.");
      alert("Session not saved. You might be in demo mode.");
      router.push("/");
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
              />
            </div>
            <div className="flex w-full  flex-grow">
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
