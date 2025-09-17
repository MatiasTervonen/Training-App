"use client";

import ModalPageWrapper from "@/app/(app)/components/modalPageWrapper";
import { useRouter } from "next/navigation";
import { TemplateSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import Modal from "@/app/(app)/components/modal";
import { useState } from "react";
import GymTemplate from "@/app/(app)/components/cards/GymTemplate";
import { ExerciseEntry } from "@/app/(app)/types/session";
import useSWR, { mutate } from "swr";
import { fetcher } from "../../lib/fetcher";
import toast from "react-hot-toast";
import { full_gym_template } from "../../types/models";


export default function TemplatesPage() {
  const [expandedItem, setExpandedItem] = useState<full_gym_template | null>(
    null
  );
  
  const router = useRouter();

  const {
    data: templates = [],
    error,
    isLoading,
  } = useSWR<full_gym_template[]>("/api/gym/get-templates", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const startWorkout = (template: full_gym_template) => {
    const workoutExercises: ExerciseEntry[] =
      template.gym_template_exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        name: ex.gym_exercises.name,
        equipment: ex.gym_exercises.equipment,
        muscle_group: ex.gym_exercises.muscle_group ?? undefined,
        main_group: ex.gym_exercises.main_group,
        sets: Array.from({ length: ex.sets ?? 0 }).map(() => ({
          reps: ex.reps ?? undefined,
          weight: undefined,
          rpe: undefined, // Default RPE
        })),
        notes: "",
        superset_id: ex.superset_id,
      }));

    const sessionDraft = {
      title: template.name,
      exercises: workoutExercises,
      notes: "",
    };

    localStorage.setItem("gym_session_draft", JSON.stringify(sessionDraft));
    localStorage.setItem("startedFromTemplate", "true");
    router.push("/training/gym");
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this template? This action cannot be undone."
    );
    if (!confirmDelete) return;

    mutate(
      "/api/gym/get-templates",
      (currentTemplates: full_gym_template[] = []) => {
        return currentTemplates.filter((t) => t.id !== templateId);
      },
      false
    );

    try {
      const res = await fetch("/api/gym/delete-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item_id: templateId }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete template");
      }

      await res.json();

      mutate("/api/gym/get-templates");
    } catch (error) {
      toast.error("Failed to delete template. Please try again.");
      mutate("/api/gym/get-templates");
      console.error("Failed to delete template:", error);
    }
  };

  return (
    <ModalPageWrapper>
      <div className="h-full text-gray-100 p-5">
        <div className="flex flex-col max-w-md mx-auto">
          <h1 className="text-gray-100 text-center  my-5 text-2xl">
            My Templates
          </h1>

          {!error && isLoading && <TemplateSkeleton count={3} />}

          {error && (
            <p className="text-red-500 text-center">
              Error loading templates. Try again!
            </p>
          )}

          {!isLoading && templates.length === 0 && (
            <p className="text-gray-300 text-center">
              No templates found. Create a new template to get started!
            </p>
          )}

          {templates &&
            templates.map((template: full_gym_template) => (
              <div
                key={template.id}
                className="text-gray-100 text-center bg-blue-800 py-2 my-3 rounded-md shadow-xl border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
                onClick={() => setExpandedItem(template)}
              >
                {template.name}
              </div>
            ))}

          {expandedItem && (
            <Modal
              noTopPadding
              isOpen={true}
              onClose={() => setExpandedItem(null)}
            >
              <GymTemplate
                item={expandedItem}
                onDelete={() => {
                  handleDeleteTemplate(expandedItem.id);
                  setExpandedItem(null);
                }}
                onExpand={() => {
                  // Handle expand logic here if needed
                  console.log("Expand template:", expandedItem.id);
                }}
                onEdit={() => {
                  // Handle edit logic here
                  console.log("Edit template:", expandedItem.id);
                }}
                onStartWorkout={() => startWorkout(expandedItem)}
              />
            </Modal>
          )}
        </div>
      </div>
    </ModalPageWrapper>
  );
}
