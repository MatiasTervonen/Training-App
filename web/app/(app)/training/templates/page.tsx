"use client";

import { useRouter } from "next/navigation";
import { TemplateSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import Modal from "@/app/(app)/components/modal";
import { useState } from "react";
import { ExerciseEntry } from "@/app/(app)/types/session";
import toast from "react-hot-toast";
import { full_gym_template } from "../../types/models";
import TemplateCard from "@/app/(app)/components/cards/TemplateCard";
import Spinner from "../../components/spinner";
import GymTemplate from "@/app/(app)/components/expandSession/template";
import { deleteTemplate } from "../../database/template";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTemplates } from "../../database/template";
import { getFullTemplate } from "../../database/template";
import { useTimerStore } from "../../lib/stores/timerStore";

type templateSummary = {
  id: string;
  name: string;
  created_at: string;
};

export default function TemplatesPage() {
  const [expandedItem, setExpandedItem] = useState<full_gym_template | null>(
    null
  );

  const activeSession = useTimerStore((state) => state.activeSession);

  const queryClient = useQueryClient();

  const router = useRouter();

  const {
    data: templates,
    error,
    isLoading,
  } = useQuery<templateSummary[]>({
    queryKey: ["templates"],
    queryFn: getTemplates,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const startWorkout = (template: full_gym_template) => {
    if (activeSession) {
      toast.error("You already have an active workout!");
      return;
    }

    const workoutExercises: ExerciseEntry[] =
      template.gym_template_exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        name: ex.gym_exercises.name,
        equipment: ex.gym_exercises.equipment,
        muscle_group: ex.gym_exercises.muscle_group ?? undefined,
        main_group: ex.gym_exercises.main_group,
        sets: [],
        superset_id: ex.superset_id,
      }));

    const sessionDraft = {
      title: template.name,
      exercises: workoutExercises,
    };

    localStorage.setItem("gym_draft", JSON.stringify(sessionDraft));
    localStorage.setItem("startedFromTemplate", "true");
    router.push("/training/gym");
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this template? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const queryKey = ["templates"];

    await queryClient.cancelQueries({ queryKey });

    const previousTemplates = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<templateSummary[]>(queryKey, (oldData) => {
      if (!oldData) return;

      return oldData.filter((template) => template.id !== templateId);
    });

    try {
      await deleteTemplate(templateId);

      toast.success("Template deleted successfully!");
    } catch {
      queryClient.setQueryData(queryKey, previousTemplates);
      toast.error("Failed to delete template. Please try again.");
    }
  };
  const templateId = expandedItem?.id;

  const {
    data: TemplateSessionFull,
    error: TemplateSessionError,
    isLoading: isLoadingTemplateSession,
  } = useQuery<full_gym_template>({
    queryKey: ["fullTemplate", templateId],
    queryFn: () => getFullTemplate(templateId!),
    enabled: !!templateId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return (
    <div className="flex flex-col max-w-md mx-auto page-padding">
      <h1 className="text-center mb-10 text-2xl">My Templates</h1>

      {!templates && isLoading && <TemplateSkeleton count={6} />}

      {error && (
        <p className="text-red-500 text-center">
          Error loading templates. Try again!
        </p>
      )}

      {!isLoading && templates?.length === 0 && (
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
              <p className="text-center text-lg mt-20 text-gray-300">
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
  );
}
