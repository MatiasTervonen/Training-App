import { useRouter } from "expo-router";
import FullScreenModal from "@/components/FullScreenModal";
import { useState } from "react";
import { ExerciseEntry } from "@/types/session";

import Toast from "react-native-toast-message";
import { full_gym_template } from "@/types/models";
import TemplateCard from "@/components/cards/TemplateCard";
import { ActivityIndicator, ScrollView, View } from "react-native";
import GymTemplate from "@/components/expandSession/template";
import { handleError } from "@/utils/handleError";
import { useQuery } from "@tanstack/react-query";
import GetTemplate from "@/api/gym/get-templates";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DeleteTemplate from "@/api/gym/delete-template";
import { queryClient } from "@/lib/queryClient";
import { confirmAction } from "@/lib/confirmAction";
import GetFullTemplate from "@/api/gym/get-full-template";
import { TemplateSkeleton } from "@/components/skeletetons";
import AppText from "@/components/AppText";

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
  } = useQuery({
    queryKey: ["get-templates"],
    queryFn: GetTemplate,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
          reps: undefined,
          weight: undefined,
          rpe: undefined, // Default RPE
        })),
        superset_id: ex.superset_id,
      }));

    const sessionDraft = {
      title: template.name,
      exercises: workoutExercises,
    };

    AsyncStorage.setItem("gym_session_draft", JSON.stringify(sessionDraft));
    AsyncStorage.setItem("startedFromTemplate", "true");
    router.push("/training/gym");
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmDelete = confirmAction({
      message: "Delete Template",
      title:
        "Are you sure you want to delete this template? This action cannot be undone.",
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
      await DeleteTemplate(templateId);

      Toast.show({
        type: "success",
        text1: "Template deleted successfully",
      });
    } catch (error) {
      queryClient.setQueryData(queryKey, previousFeed);
      handleError(error, {
        message: "Error deleting template",
        route: "/api/gym/delete-template",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: "Failed to delete template",
        text2: "Please try again.",
      });
    }
  };
  const templateId = expandedItem?.id;

  const {
    data: TemplateSessionFull,
    error: TemplateSessionError,
    isLoading: isLoadingTemplateSession,
  } = useQuery({
    queryKey: ["fullGymTemplate", templateId],
    queryFn: () => GetFullTemplate(templateId!),
    enabled: !!templateId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return (
    <ScrollView
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 text-gray-100 px-6">
        <AppText className="text-gray-100 text-center  mt-5 mb-10 text-2xl">
          My Templates
        </AppText>

        {!error && isLoading && <TemplateSkeleton count={6} />}

        {error && (
          <AppText className="text-red-500 text-center">
            Error loading templates. Try again!
          </AppText>
        )}

        {!isLoading && templates.length === 0 && (
          <AppText className="text-gray-300 text-center">
            No templates found. Create a new template to get started!
          </AppText>
        )}

        {templates &&
          templates.map((template: templateSummary) => (
            <TemplateCard
              key={template.id}
              item={template}
              onDelete={() => handleDeleteTemplate(template.id)}
              onExpand={() => setExpandedItem(template as full_gym_template)}
              onEdit={() => {
                router.push(`/training/templates/${template.id}`);
              }}
            />
          ))}

        {expandedItem && (
          <FullScreenModal isOpen={true} onClose={() => setExpandedItem(null)}>
              {isLoadingTemplateSession ? (
                <View className="gap-5 items-center justify-center pt-40">
                  <AppText>Loading template details...</AppText>
                  <ActivityIndicator />
                </View>
              ) : TemplateSessionError ? (
                <AppText className="text-center text-lg mt-10">
                  Failed to load template details. Please try again later.
                </AppText>
              ) : (
                TemplateSessionFull && (
                  <GymTemplate
                    item={TemplateSessionFull}
                    onStartWorkout={() => startWorkout(TemplateSessionFull)}
                  />
                )
              )}       
          </FullScreenModal>
        )}
      </View>
    </ScrollView>
  );
}
