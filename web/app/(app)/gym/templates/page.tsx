"use client";

import { useRouter } from "next/navigation";
import { TemplateSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import Modal from "@/app/(app)/components/modal";
import { useState } from "react";
import { full_gym_template } from "@/app/(app)/types/models";
import TemplateCard from "@/app/(app)/components/feed-cards/TemplateCard";
import Spinner from "@/app/(app)/components/spinner";
import GymTemplate from "@/app/(app)/components/expand-session-cards/template";
import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "@/app/(app)/database/gym/templates/get-templates";
import { getFullTemplate } from "@/app/(app)/database/gym/templates/full-gym-template";
import useDeleteTemplate from "@/app/(app)/gym/hooks/template/useDeleteTemplate";
import useStartWorkoutTemplate from "@/app/(app)/gym/hooks/template/useStartWorkoutTemplate";

type templateSummary = {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string | null;
};

export default function TemplatesPage() {
  const [expandedItem, setExpandedItem] = useState<full_gym_template | null>(
    null
  );

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

  // useStartWorkoutTemplate hook to start a workout from a template

  const { startWorkout } = useStartWorkoutTemplate();

  // useDeleteTemplate hook to delete a template

  const { handleDeleteTemplate } = useDeleteTemplate();

  const templateId = expandedItem?.id;

  const {
    data: TemplateSessionFull,
    error: TemplateSessionError,
    isLoading: isLoadingTemplateSession,
  } = useQuery({
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
              router.push(`/gym/templates/${template.id}/edit`);
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
              <p className="text-center text-lg mt-40 text-gray-300 px-10">
                Failed to load template details. Please try again later.
              </p>
            ) : (
              TemplateSessionFull && (
                <GymTemplate
                  item={TemplateSessionFull as unknown as full_gym_template}
                  onStartWorkout={() =>
                    startWorkout(
                      TemplateSessionFull as unknown as full_gym_template
                    )
                  }
                />
              )
            )}
          </>
        </Modal>
      )}
    </div>
  );
}
