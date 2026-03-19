import { useRouter } from "expo-router";
import FullScreenModal from "@/components/FullScreenModal";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TemplateSkeleton } from "@/components/skeletetons";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { getActivityTemplates } from "@/database/activities/get-templates";
import { templateSummary } from "@/types/session";
import ActivityTemplateCard from "@/features/activities/templates/cards/template-feed";
import ActivityTemplateExpanded from "@/features/activities/templates/cards/template-expanded";
import { useStartActivity } from "@/features/activities/templates/hooks/useStartActivity";
import { useDeleteTemplate } from "@/features/activities/templates/hooks/useDeleteTemplate";
import { useTemplateHistory } from "@/features/activities/templates/hooks/useTemplateHistory";
import TemplateHistoryModal from "@/features/activities/templates/components/TemplateHistoryModal";
import { useTranslation } from "react-i18next";
import { Route } from "lucide-react-native";
import InfoModal from "@/components/InfoModal";
import DraggableList from "@/components/DraggableList";
import { reorderActivityTemplates } from "@/database/activities/reorder-templates";

export default function TemplatesPage() {
  const { t } = useTranslation("activities");
  const [expandedItem, setExpandedItem] = useState<templateSummary | null>(
    null,
  );
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: templates = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["get-activity-templates"],
    queryFn: getActivityTemplates,
  });

  // useStartActivity hook to start an activity from a template
  const { startActivity, isStartingActivity, showGpsModal, dismissGpsModal } =
    useStartActivity();

  // useDeleteTemplate hook to delete a template
  const { handleDeleteTemplate } = useDeleteTemplate();

  // useTemplateHistory hook
  const {
    history,
    historyError,
    isLoadingHistory,
    isHistoryOpen,
    historyTemplateName,
    openHistory,
    closeHistory,
  } = useTemplateHistory();

  const handleReorder = useCallback(
    (reordered: templateSummary[]) => {
      queryClient.setQueryData(["get-activity-templates"], reordered);
      const ids = reordered.map((t) => t.template.id);
      reorderActivityTemplates(ids).catch(() => {
        queryClient.invalidateQueries({
          queryKey: ["get-activity-templates"],
        });
      });
    },
    [queryClient],
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={scrollEnabled}
    >
      <PageContainer>
        <AppText className="text-center mb-10 text-2xl">
          {t("activities.templatesScreen.title")}
        </AppText>

        {!error && isLoading && <TemplateSkeleton count={6} />}

        {error && (
          <View className="bg-slate-900 rounded-md mt-20 px-10 items-center justify-center">
            <AppText className="text-red-500 text-center text-lg">
              {t("activities.templatesScreen.loadError")}
            </AppText>
          </View>
        )}

        {!isLoading && templates.length === 0 && (
          <View className="items-center mt-[20%] px-8">
            <View className="items-center">
              <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
                <Route size={36} color="#94a3b8" />
              </View>
              <AppText className="text-xl text-center mb-3">
                {t("activities.templatesScreen.noTemplates")}
              </AppText>
              <AppText className="text-sm text-gray-400 text-center leading-5">
                {t("activities.templatesScreen.noTemplatesHint")}
              </AppText>
            </View>
          </View>
        )}

        {templates.length > 0 && (
          <DraggableList
            items={templates}
            keyExtractor={(item) => item.template.id}
            onReorder={handleReorder}
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
            renderItem={(template, index) => (
              <View className="pb-5">
                <ActivityTemplateCard
                  index={index}
                  item={template}
                  onDelete={() => handleDeleteTemplate(template.template.id)}
                  onExpand={() => setExpandedItem(template)}
                  onEdit={() => {
                    router.push(
                      `/activities/templates/${template.template.id}`,
                    );
                  }}
                  onHistory={() =>
                    openHistory(template.template.id, template.template.name)
                  }
                />
              </View>
            )}
          />
        )}

        {expandedItem && (
          <FullScreenModal isOpen={true} onClose={() => setExpandedItem(null)} scrollable={false}>
            <ActivityTemplateExpanded
              item={expandedItem}
              onStartActivity={() => startActivity(expandedItem)}
              isStartingActivity={isStartingActivity}
              onHistory={() =>
                openHistory(
                  expandedItem.template.id,
                  expandedItem.template.name,
                )
              }
            />
          </FullScreenModal>
        )}
        <TemplateHistoryModal
          isOpen={isHistoryOpen}
          onClose={closeHistory}
          isLoading={isLoadingHistory}
          history={Array.isArray(history) ? history : []}
          templateName={historyTemplateName}
          error={historyError ? historyError.message : null}
        />
        <InfoModal
          visible={showGpsModal}
          onClose={dismissGpsModal}
          title={t("activities.infoModal.locationTrackingDisabled")}
          description={t("activities.infoModal.enableLocationMessage")}
          cancelLabel={t("activities.infoModal.cancel")}
          confirmLabel={t("activities.infoModal.settings")}
          onConfirm={() => {
            dismissGpsModal();
            router.push("/menu/settings");
          }}
        />
      </PageContainer>
    </ScrollView>
  );
}
