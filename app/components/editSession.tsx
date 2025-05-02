import { Exercise, Session } from "@/types/session";
import Modal from "@/app/components/modal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { russoOne } from "@/app/ui/fonts";
import EditExercises from "../ui/editSession/exercises";

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

  const router = useRouter();

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
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update session");
    }
  };

  return (
    <Modal isOpen={!!session} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {"title" in session && (
          <div className="w-full flex flex-col mb-4 mt-10">
            <p>Title...</p>
            <input
              type="text"
              value={formData.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              className="text-lg text-black p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
            />
          </div>
        )}
        {"notes" in session && (
          <div className="w-full flex flex-col mb-4 mt-10">
            <p>Notes...</p>
            <textarea
              className="text-md w-full  text-black p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500  dark:text-gray-100 bg-gray-100 dark:bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300 resize-none"
              spellCheck={false}
              placeholder="Add Notes here..."
              name="notes"
              autoComplete="off"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>
        )}

        {"exercises" in session && formData.exercises !== null && (
          <div>
            <p>Exercises...</p>
            <EditExercises
              exercises={formData.exercises || []}
              onChange={(exercises) => handleChange("exercises", exercises)}
            />
          </div>
        )}
      </form>

      <button
        onClick={handleSubmit}
        type="submit"
        className={`${russoOne.className} bg-blue-800 py-2 px-10 my-3 w-full  rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
      >
        Save
      </button>
    </Modal>
  );
}
