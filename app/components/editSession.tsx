"use client";

import { Exercise, Session } from "@/types/session";
import Modal from "@/app/components/modal";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import EditExercises from "../ui/editSession/exercises";
import SaveButton from "@/app/ui/save-button";

type SessionUpdatePayload = {
  id: number | string;
  title?: string;
  exercises?: Exercise[];
  notes?: string;
  duration?: number;
  type?: string;
};

export default function EditSession({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Session>>({
    ...session,
  });
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto"; // Reset height
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [formData.notes]);

  const handleChange = (
    field: keyof Session,
    value: string | number | boolean | string[] | null | Exercise[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const bodyToSend: SessionUpdatePayload = {
      id: session.id,
    };

    if (formData.title != null) bodyToSend.title = formData.title;
    if (formData.exercises != null) bodyToSend.exercises = formData.exercises;
    if (formData.notes != null) bodyToSend.notes = formData.notes;
    if (formData.duration != null) bodyToSend.duration = formData.duration;

    console.log("Sending to API:", bodyToSend);

    const res = await fetch("/api/update-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyToSend),
    });

    console.log("response", res);

    if (res.ok) {
      router.refresh();
      onClose();
      setIsSaving(false);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update session");
    }
  };

  return (
    <Modal isOpen={!!session} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-4">
        {"title" in session && (
          <div className="w-full flex flex-col mb-4 mt-10 ">
            <p>Title...</p>
            <input
              type="text"
              value={formData.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              className="p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500 text-gray-100 bg-gray-700 hover:border-blue-500 focus:outline-none focus:border-green-300"
            />
          </div>
        )}
        {"notes" in session && (
          <div className="w-full flex flex-col mb-10 mt-5">
            <p>Notes...</p>
            <textarea
              ref={textAreaRef}
              className="w-full   p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500  text-gray-100 bg-gray-700 hover:border-blue-500 focus:outline-none focus:border-green-300 resize-none"
              spellCheck={false}
              placeholder="Add Notes here..."
              name="notes"
              rows={1}
              autoComplete="off"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>
        )}

        {"exercises" in session && formData.exercises !== null && (
          <div>
            <EditExercises
              exercises={formData.exercises || []}
              onChange={(exercises) => handleChange("exercises", exercises)}
            />
          </div>
        )}
      </form>

      <div className="flex items-center justify-center mb-20 mt-10 mx-10">
        <SaveButton
          isSaving={isSaving}
          label="Save Changes"
          onClick={() =>
            handleSubmit(new Event("submit") as unknown as React.FormEvent)
          }
        />
      </div>
    </Modal>
  );
}
