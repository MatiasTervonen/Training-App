"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import Modal from "@/components/modal";
import Spinner from "@/components/spinner";
import { getActivityTemplates } from "@/database/activities/get-templates";
import { getTemplateHistory } from "@/database/activities/get-template-history";
import { deleteActivityTemplate } from "@/database/activities/delete-template";
import { templateSummary } from "@/types/models";
import ActivityTemplateCard from "@/features/activities/templates/ActivityTemplateCard";
import ActivityTemplateExpanded from "@/features/activities/templates/ActivityTemplateExpanded";
import TemplateHistoryModal from "@/features/activities/templates/TemplateHistoryModal";
import EmptyState from "@/components/EmptyState";
import { MapPin } from "lucide-react";

export default function TemplatesPage() {
  const { t } = useTranslation("activities");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedItem, setExpandedItem] = useState<templateSummary | null>(null);
  const [historyTemplateId, setHistoryTemplateId] = useState("");
  const [historyTemplateName, setHistoryTemplateName] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    data: templates = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["get-activity-templates"],
    queryFn: getActivityTemplates,
  });

  const {
    data: history = [],
    error: historyError,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: ["template-history", historyTemplateId],
    queryFn: () => getTemplateHistory(historyTemplateId),
    enabled: isHistoryOpen && !!historyTemplateId,
  });

  const openHistory = (templateId: string, templateName: string) => {
    setExpandedItem(null);
    setHistoryTemplateId(templateId);
    setHistoryTemplateName(templateName);
    setIsHistoryOpen(true);
  };

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
        <EmptyState
          icon={MapPin}
          title={t("activities.templatesScreen.noTemplates")}
          description={t("activities.templatesScreen.noTemplatesHint")}
        />
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
        {expandedItem && (
          <ActivityTemplateExpanded
            item={expandedItem}
            onHistory={() =>
              openHistory(
                expandedItem.template.id,
                expandedItem.template.name
              )
            }
          />
        )}
      </Modal>

      <TemplateHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        isLoading={isLoadingHistory}
        history={history}
        templateName={historyTemplateName}
        error={historyError ? String(historyError) : null}
      />
    </div>
  );
}
