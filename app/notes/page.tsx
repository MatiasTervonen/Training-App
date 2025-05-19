"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { russoOne } from "@/app/ui/fonts";
import SaveButton from "@/app/ui/save-button";
import DeleteSessionBtn from "../ui/deleteSessionBtn";

export default function Notes() {
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesTitle, setNotesTitle] = useState(() => {
    return "Notes";
  });
  const router = useRouter();

  const saveNotes = async () => {
    if (notes.length === 0) return;
    setIsSaving(true); // Start saving
    const response = await fetch("/api/save-session", {
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
    }
    setIsSaving(false); // End saving (in case something goes wrong)
  };

  useEffect(() => {
    if (notes.length === 0) return;

    const interval = setInterval(() => {
      const sessionDraft = {
        title: notesTitle,
        notes,
      };
      localStorage.setItem("notes_draft", JSON.stringify(sessionDraft));
    }, 1000); // Save every second

    return () => clearInterval(interval);
  }, [notes, notesTitle]);

  const resetNotes = () => {
    localStorage.removeItem("notes_draft");
    setNotesTitle("Notes");
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
    <div className="flex flex-col min-h-screen w-full bg-slate-950">
      <div className="flex flex-col flex-grow">
        <div className="flex flex-col items-center justify-center mt-5 mx-10 gap-5">
          <p
            className={`${russoOne.className} text-gray-100 font-bold text-lg
                    `}
          >
            Add your notes here
          </p>
          <div className="mb-5">
            <p className="text-gray-100 pb-1">Title...</p>
            <input
              className="text-lg  p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 text-gray-100 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
              type="text"
              value={notesTitle}
              onChange={(e) => setNotesTitle(e.target.value)}
            />
          </div>
          <div className="w-full ">
            <div className="flex items-center pb-1">
              <label htmlFor="notes" className="text-gray-100">Add notes...</label>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="size-6 mb-2"
              >
                <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
              </svg>
            </div>
            <textarea
              className="text-md w-full p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500  text-gray-100 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300 resize-none"
              spellCheck={false}
              placeholder="Add Notes here..."
              name="notes"
              rows={5}
              cols={30}
              autoComplete="off"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col  items-center justify-center mt-10 gap-5 mx-10 mb-20">
          <SaveButton isSaving={isSaving} onClick={saveNotes} />
          <DeleteSessionBtn
            storageKey={["notes_draft"]}
            onDelete={resetNotes}
          ></DeleteSessionBtn>
        </div>
      </div>
    </div>
  );
}
