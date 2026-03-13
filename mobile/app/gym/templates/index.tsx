import { useRouter } from "expo-router";
import FullScreenModal from "@/components/FullScreenModal";
import { useState } from "react";
import { ExerciseEntry } from "@/types/session";
import Toast from "react-native-toast-message";
import TemplateCard from "@/features/gym/cards/Template-feed";
import { ActivityIndicator, ScrollView, View } from "react-native";
import GymTemplate from "@/features/gym/cards/template-expanded";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTemplates } from "@/database/gym/get-templates";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteTemplate } from "@/database/gym/delete-template";
import { useConfirmAction } from "@/lib/confirmAction";
import { getFullTemplate } from "@/database/gym/get-full-template";
import { TemplateSkeleton } from "@/components/skeletetons";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { full_gym_template } from "@/types/models";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useTranslation } from "react-i18next";

type templateSummary = {
  id: string;
  name: string;
  created_at: string;
};

export default function TemplatesPage() {
  const { t } = useTranslation(["gym", "common"]);
  const [expandedItem, setExpandedItem] = useState<full_gym_template | null>(
    null,
  );

  const confirmAction = useConfirmAction();

  const activeSession = useTimerStore((state) => state.activeSession);

  const queryClient = useQueryClient();

  const router = useRouter();

  const {
    data: templates = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["get-templates"],
    queryFn: getTemplates,
  });

  const startWorkout = async (template: full_gym_template) => {
    if (activeSession) {
      Toast.show({
        type: "error",
        text1: t("gym.activeSessionError"),
        text2: t("gym.activeSessionErrorSub"),
      });
      return;
    }

    const workoutExercises: ExerciseEntry[] =
      template.gym_template_exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        template_id: template.id,
        position: ex.position,
        name: ex.gym_exercises.name,
        equipment: ex.gym_exercises.equipment,
        muscle_group: ex.gym_exercises.muscle_group,
        main_group: ex.gym_exercises.main_group,
        sets: [],
        superset_id: ex.superset_id,
      }));

    // Build phase data from template phases
    const templatePhases = (template as typeof template & {
      gym_template_phases?: {
        phase_type: string;
        activity_id: string;
        activities: { name: string; slug: string | null; base_met: number; is_step_relevant: boolean; is_calories_relevant: boolean } | null;
      }[];
    }).gym_template_phases;

    let warmup = null;
    let cooldown = null;

    if (templatePhases) {
      const wp = templatePhases.find((p) => p.phase_type === "warmup");
      if (wp?.activities) {
        warmup = {
          phase_type: "warmup" as const,
          activity_id: wp.activity_id,
          activity_name: wp.activities.name,
          activity_slug: wp.activities.slug,
          activity_met: wp.activities.base_met,
          is_step_relevant: wp.activities.is_step_relevant,
          is_calories_relevant: wp.activities.is_calories_relevant,
          input_mode: "live" as const,
          duration_seconds: 0,
          steps: null,
          distance_meters: null,
          is_manual: false,
          is_tracking: false,
          tracking_started_at: null,
        };
      }
      const cd = templatePhases.find((p) => p.phase_type === "cooldown");
      if (cd?.activities) {
        cooldown = {
          phase_type: "cooldown" as const,
          activity_id: cd.activity_id,
          activity_name: cd.activities.name,
          activity_slug: cd.activities.slug,
          activity_met: cd.activities.base_met,
          is_step_relevant: cd.activities.is_step_relevant,
          is_calories_relevant: cd.activities.is_calories_relevant,
          input_mode: "live" as const,
          duration_seconds: 0,
          steps: null,
          distance_meters: null,
          is_manual: false,
          is_tracking: false,
          tracking_started_at: null,
        };
      }
    }

    const sessionDraft = {
      title: template.name,
      exercises: workoutExercises,
      warmup,
      cooldown,
    };

    await AsyncStorage.setItem(
      "gym_session_draft",
      JSON.stringify(sessionDraft),
    );
    await AsyncStorage.setItem("startedFromTemplate", "true");
    router.push("/gym/gym");
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmDelete = await confirmAction({
      title: t("gym.TemplatesScreen.confirmDeleteTitle"),
      message: t("gym.TemplatesScreen.confirmDeleteMessage"),
    });
    if (!confirmDelete) return;

    const queryKey = ["get-templates"];

    const previousFeed =
      queryClient.getQueryData<full_gym_template[]>(queryKey);

    queryClient.setQueryData<full_gym_template[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      return oldData.filter((item) => item.id !== templateId);
    });

    try {
      await deleteTemplate(templateId);

      Toast.show({
        type: "success",
        text1: t("gym.TemplatesScreen.deleteSuccess"),
      });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      Toast.show({
        type: "error",
        text1: t("gym.TemplatesScreen.deleteError1"),
        text2: t("gym.TemplatesScreen.deleteError2"),
      });
    }
  };
  const templateId = expandedItem?.id;

  const {
    data: TemplateSessionFull,
    error: TemplateSessionError,
    isLoading: isLoadingTemplateSession,
  } = useQuery({
    queryKey: ["full_gym_template", templateId],
    queryFn: () => getFullTemplate(templateId!),
    enabled: !!templateId,
  });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <PageContainer>
        <AppText className="text-center mb-10 text-2xl">
          {t("gym.TemplatesScreen.title")}
        </AppText>

        {!error && isLoading && <TemplateSkeleton count={6} />}

        {error && (
          <AppText className="text-red-500 text-center">
            {t("gym.TemplatesScreen.errorLoading")}
          </AppText>
        )}

        {!isLoading && templates.length === 0 && (
          <AppText className="text-gray-300 text-center">
            {t("gym.TemplatesScreen.noTemplates")}
          </AppText>
        )}

        {templates &&
          templates.map((template: templateSummary, index: number) => (
            <TemplateCard
              index={index}
              key={template.id}
              item={template}
              onDelete={() => handleDeleteTemplate(template.id)}
              onExpand={() => setExpandedItem(template as full_gym_template)}
              onEdit={() => {
                router.push(`/gym/templates/${template.id}`);
              }}
            />
          ))}

        {expandedItem && (
          <FullScreenModal isOpen={true} onClose={() => setExpandedItem(null)}>
            {isLoadingTemplateSession ? (
              <View className="gap-5 items-center justify-center pt-40">
                <AppText className="text-lg">
                  {t("gym.TemplatesScreen.loadingExpanded")}
                </AppText>
                <ActivityIndicator size="large" />
              </View>
            ) : TemplateSessionError ? (
              <AppText className="text-center text-lg mt-10">
                {t("gym.TemplatesScreen.errorLoadingExpanded")}
              </AppText>
            ) : (
              TemplateSessionFull && (
                <GymTemplate
                  item={TemplateSessionFull as any}
                  onStartWorkout={() =>
                    startWorkout(TemplateSessionFull as any)
                  }
                />
              )
            )}
          </FullScreenModal>
        )}
      </PageContainer>
    </ScrollView>
  );
}
