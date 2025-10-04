"use client";

import { useRouter } from "next/navigation";
import { TemplateSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import Modal from "@/app/(app)/components/modal";
import { useState } from "react";
import { ExerciseEntry } from "@/app/(app)/types/session";
import useSWR, { mutate } from "swr";
import { fetcher } from "../../lib/fetcher";
import toast from "react-hot-toast";
import { full_gym_template } from "../../types/models";
import TemplateCard from "@/app/(app)/components/cards/TemplateCard";
import Spinner from "../../components/spinner";
import GymTemplate from "@/app/(app)/components/expandSession/template";

type templateSummary = {
  id: string;
  name: string;
  created_at: string;
};

export default function TemplatesPage() {
  const [expandedItem, setExpandedItem] = useState<full_gym_template | null>(
    null
  );

  const router = useRouter();

  const {
    data: templates = [],
    error,
    isLoading,
  } = useSWR<templateSummary[]>("/api/gym/get-templates", fetcher, {
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
        superset_id: ex.superset_id,
      }));

    const sessionDraft = {
      title: template.name,
      exercises: workoutExercises,
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
    } catch (error) {
      toast.error("Failed to delete template. Please try again.");
      mutate("/api/gym/get-templates");
      console.error("Failed to delete template:", error);
    }
  };
  const templateId = expandedItem?.id;

  const {
    data: TemplateSessionFull,
    error: TemplateSessionError,
    isLoading: isLoadingTemplateSession,
  } = useSWR<full_gym_template>(
    templateId ? `/api/gym/get-full-template?id=${templateId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  return (
      <div className="h-full text-gray-100 p-5">
        <div className="flex flex-col max-w-md mx-auto">
          <h1 className="text-gray-100 text-center  mt-5 mb-10 text-2xl">
            My Templates
          </h1>

          {!error && isLoading && <TemplateSkeleton count={6} />}

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
            templates.map((template: templateSummary) => (
              <TemplateCard
                key={template.id}
                item={template}
                onDelete={() => handleDeleteTemplate(template.id)}
                onExpand={() => setExpandedItem(template as full_gym_template)}
                onEdit={() => {
                  router.push(`/training/templates/${template.id}/edit`);
                }}
              />
            ))}

          {expandedItem && (
            <Modal isOpen={true} onClose={() => setExpandedItem(null)}>
              <>
                {isLoadingTemplateSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40">
                    <p>Loading template details...</p>
                    <Spinner />
                  </div>
                ) : TemplateSessionError ? (
                  <p className="text-center text-lg mt-10">
                    Failed to load template details. Please try again later.
                  </p>
                ) : (
                  TemplateSessionFull && (
                    <GymTemplate
                      item={TemplateSessionFull}
                      onStartWorkout={() => startWorkout(TemplateSessionFull)}
                    />
                  )
                )}
              </>
            </Modal>
          )}
        </div>
      </div>
  );
}
