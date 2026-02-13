"use client";

import { useRouter } from "next/navigation";
import { TemplateSkeleton } from "@/ui/loadingSkeletons/skeletons";
import Modal from "@/components/modal";
import { useState } from "react";
import TemplateCard from "@/features/gym/cards/TemplateCard";
import Spinner from "@/components/spinner";
import GymTemplate from "@/features/gym/cards/template-expanded";
import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "@/database/gym/templates/get-templates";
import { getFullTemplate } from "@/database/gym/templates/full-gym-template";
import useDeleteTemplate from "@/features/gym/hooks/template/useDeleteTemplate";
import useStartWorkoutTemplate from "@/features/gym/hooks/template/useStartWorkoutTemplate";
import { useTranslation } from "react-i18next";
import { FullGymTemplate } from "@/database/gym/templates/full-gym-template";

type templateSummary = {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string | null;
};

export default function TemplatesPage() {
  const { t } = useTranslation("gym");
  const [expandedItem, setExpandedItem] = useState<FullGymTemplate | null>(
    null,
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

  console.log("templates", TemplateSessionFull);

  return (
    <div className="flex flex-col max-w-md mx-auto page-padding">
      <h1 className="text-center mb-10 text-2xl">
        {t("gym.TemplatesScreen.title")}
      </h1>

      {!templates && isLoading && <TemplateSkeleton count={6} />}

      {error && (
        <p className="text-red-500 text-center mt-20 px-10">
          {t("gym.TemplatesScreen.errorLoading")}
        </p>
      )}

      {!isLoading && templates?.length === 0 && (
        <p className="text-gray-300 text-center mt-20 px-10">
          {t("gym.TemplatesScreen.noTemplates")}
        </p>
      )}

      {templates &&
        templates.map((template: templateSummary) => (
          <TemplateCard
            key={template.id}
            item={template}
            onDelete={() => handleDeleteTemplate(template.id)}
            onExpand={() =>
              setExpandedItem(template as unknown as FullGymTemplate)
            }
            onEdit={() => {
              router.push(`/gym/templates/${template.id}/edit`);
            }}
          />
        ))}

      {expandedItem && (
        <Modal isOpen={true} onClose={() => setExpandedItem(null)}>
          <>
            {isLoadingTemplateSession ? (
              <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10">
                <p className="text-lg">
                  {t("gym.TemplatesScreen.loadingExpanded")}
                </p>
                <Spinner />
              </div>
            ) : TemplateSessionError ? (
              <p className="text-center text-lg mt-40 text-gray-300 px-10">
                {t("gym.TemplatesScreen.errorLoadingExpanded")}
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
