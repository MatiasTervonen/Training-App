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
        noTopPadding
        onSwipeRight={() => router.back()}
        leftLabel="back"
        onSwipeLeft={() => router.push("/")}
        rightLabel="home"
      >
        <div className="flex flex-col h-full w-full bg-slate-800 ">
          <div className="flex flex-col flex-grow  ">
            <div className="flex flex-col items-center justify-center mt-5 mx-10 gap-5 ">
              <p
                className={`${russoOne.className} text-gray-100 font-bold text-lg
                    `}
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
              <div className="flex flex-col w-full xl:max-w-md">
                <NotesInput
                  notes={notes}
                  setNotes={setNotes}
                  placeholder="Write your notes here..."
                  rows={6}
                  cols={10}
                  label="Notes..."
                />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center mt-10 gap-5 mx-10 mb-20  xl:max-w-md xl:w-full xl:mx-auto xl:mt-20">
              <SaveButton isSaving={isSaving} onClick={saveNotes} />
              <DeleteSessionBtn
                storageKey={["notes_draft"]}
                onDelete={resetNotes}
              ></DeleteSessionBtn>
            </div>
          </div>
        </div>
      </ModalPageWrapper>
      {isSaving && <FullScreenLoader message="Saving notes..." />}
    </>
  );
}
