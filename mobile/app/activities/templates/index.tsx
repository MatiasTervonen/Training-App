import { useRouter } from "expo-router";
import FullScreenModal from "@/components/FullScreenModal";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { TemplateSkeleton } from "@/components/skeletetons";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { getActivityTemplates } from "@/database/activities/get-templates";
import { templateSummary } from "@/types/session";
import ActivityTemplateCard from "@/features/activities/templates/cards/template-feed";
import ActivityTemplateExpanded from "@/features/activities/templates/cards/template-expanded";
import { useStartActivity } from "@/features/activities/templates/hooks/useStartActivity";
import { useDeleteTemplate } from "@/features/activities/templates/hooks/useDeleteTemplate";

export default function TemplatesPage() {
  const [expandedItem, setExpandedItem] = useState<templateSummary | null>(
    null,
  );

  const router = useRouter();

  const {
    data: templates = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["get-activity-templates"],
    queryFn: getActivityTemplates,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // useStartActivity hook to start an activity from a template
  const { startActivity, isStartingActivity } = useStartActivity();

  // useDeleteTemplate hook to delete a template
  const { handleDeleteTemplate } = useDeleteTemplate();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <PageContainer>
        <AppText className="text-center mb-10 text-2xl">My Templates</AppText>

        {!error && isLoading && <TemplateSkeleton count={6} />}

        {error && (
          <View className="bg-slate-900 rounded-md py-10 px-10 items-center justify-center">
            <AppText className="text-red-500 text-center text-lg">
              Error loading templates. Try again!
            </AppText>
          </View>
        )}

        {!isLoading && templates.length === 0 && (
          <View className="bg-slate-900 rounded-md py-10 px-10 items-center justify-center gap-2">
            <AppText className="text-gray-300 text-lg">
              No templates found.
            </AppText>
            <AppText className="text-gray-300 text-lg">
              Create a new template to get started!
            </AppText>
          </View>
        )}

        {templates &&
          templates.map((template: templateSummary, index: number) => (
            <ActivityTemplateCard
              index={index}
              key={template.template.id}
              item={template}
              onDelete={() => handleDeleteTemplate(template.template.id)}
              onExpand={() => setExpandedItem(template)}
              onEdit={() => {
                router.push(`/activities/templates/${template.template.id}`);
              }}
            />
          ))}

        {expandedItem && (
          <FullScreenModal isOpen={true} onClose={() => setExpandedItem(null)}>
            <ActivityTemplateExpanded
              item={expandedItem}
              onStartActivity={() => startActivity(expandedItem)}
              isStartingActivity={isStartingActivity}
            />
          </FullScreenModal>
        )}
      </PageContainer>
    </ScrollView>
  );
}
