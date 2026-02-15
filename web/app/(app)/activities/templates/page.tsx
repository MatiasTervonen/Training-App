"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import Modal from "@/components/modal";
import Spinner from "@/components/spinner";
import { getActivityTemplates } from "@/database/activities/get-templates";
import { deleteActivityTemplate } from "@/database/activities/delete-template";
import { templateSummary } from "@/types/models";
import ActivityTemplateCard from "@/features/activities/templates/ActivityTemplateCard";
import ActivityTemplateExpanded from "@/features/activities/templates/ActivityTemplateExpanded";

export default function TemplatesPage() {
  const { t } = useTranslation("activities");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedItem, setExpandedItem] = useState<templateSummary | null>(null);

  const {
    data: templates = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["get-activity-templates"],
    queryFn: getActivityTemplates,
  });

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteActivityTemplate(templateId);
      queryClient.refetchQueries({
        queryKey: ["get-activity-templates"],
        exact: true,
      });
      toast.success(t("activities.editActivityScreen.successDeleted"));
    } catch {
      toast.error(t("activities.editActivityScreen.errorDeleteFailed"));
    }
  };

  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl">
        {t("activities.templatesScreen.title")}
      </h1>

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 mt-20">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="bg-slate-900 rounded-md mt-20 px-10 py-5 text-center">
          <p className="text-red-500 text-lg">
            {t("activities.templatesScreen.loadError")}
          </p>
        </div>
      )}

      {!isLoading && !error && templates.length === 0 && (
        <div className="bg-slate-900 rounded-md mt-20 px-10 py-5 text-center">
          <p className="text-gray-300 text-lg">
            {t("activities.templatesScreen.noTemplates")}
          </p>
          <p className="text-gray-300 text-lg mt-2">
            {t("activities.templatesScreen.noTemplatesHint")}
          </p>
        </div>
      )}

      {templates.map((template) => (
        <ActivityTemplateCard
          key={template.template.id}
          item={template}
          onDelete={() => handleDeleteTemplate(template.template.id)}
          onExpand={() => setExpandedItem(template)}
          onEdit={() => router.push(`/activities/templates/${template.template.id}`)}
        />
      ))}

      <Modal isOpen={!!expandedItem} onClose={() => setExpandedItem(null)}>
        {expandedItem && <ActivityTemplateExpanded item={expandedItem} />}
      </Modal>
    </div>
  );
}
