import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useCallback } from "react";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import { editTemplate } from "@/database/activities/edit-template";
import Toast from "react-native-toast-message";
import SubNotesInput from "@/components/SubNotesInput";
import ActivityDropdown from "@/features/activities/components/activityDropdown";
import AnimatedButton from "@/components/buttons/animatedButton";
import FullScreenModal from "@/components/FullScreenModal";
import { activities_with_category } from "@/types/models";
import { useQueryClient } from "@tanstack/react-query";
import { templateSummary } from "@/types/session";
import DeleteButton from "@/components/buttons/DeleteButton";
import { useTranslation } from "react-i18next";

export default function ActivityTemplateEditScreen() {
  const { t } = useTranslation("activities");
  const { id } = useLocalSearchParams<{ id?: string }>();
  const templateId = id;

  const queryClient = useQueryClient();

  const template = queryClient
    .getQueryData<templateSummary[]>(["get-activity-templates"])
    ?.find((t) => t.template.id === templateId);

  const [name, setName] = useState(template?.template.name || "");
  const [notes, setNotes] = useState(template?.template.notes || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<activities_with_category>(
      template?.activity as activities_with_category,
    );

  const getActivityName = useCallback(
    (activity: activities_with_category | null) => {
      if (!activity) return t("activities.editTemplateScreen.selectActivity");
      if (activity.slug) {
        const translated = t(`activities.activityNames.${activity.slug}`, {
          defaultValue: "",
        });
        if (translated && translated !== `activities.activityNames.${activity.slug}`) {
          return translated;
        }
      }
      return activity.name;
    },
    [t],
  );

  const handleSave = async () => {
    if (!templateId) return;

    if (name.trim() === "") {
      Toast.show({
        type: "error",
        text1: t("activities.editTemplateScreen.errorTitle"),
        text2: t("activities.editTemplateScreen.errorEmptyName"),
      });
      return;
    }

    try {
      setIsLoading(true);
      await editTemplate({
        id: templateId,
        name,
        notes,
        activityId: selectedActivity!.id,
      });

      queryClient.invalidateQueries({
        queryKey: ["get-activity-templates"],
        exact: true,
      });

      Toast.show({
        type: "success",
        text1: t("activities.editTemplateScreen.successTitle"),
        text2: t("activities.editTemplateScreen.successMessage"),
      });
      router.push("/activities/templates");
    } catch (error) {
      console.error("Error saving template", error);
      Toast.show({
        type: "error",
        text1: t("activities.editTemplateScreen.errorTitle"),
        text2: t("activities.editTemplateScreen.errorGeneric"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!template) {
    return (
      <PageContainer>
        <AppText className="text-2xl text-center mb-10">
          {t("activities.editTemplateScreen.title")}
        </AppText>
        <AppText className="text-center text-red-500 mt-20">
          {t("activities.editTemplateScreen.templateNotFound")}
        </AppText>
      </PageContainer>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <PageContainer className="justify-between">
        <View>
          <AppText className="text-2xl text-center mb-10">
            {t("activities.editTemplateScreen.title")}
          </AppText>
          <View className="mb-5">
            <AppInput
              value={name}
              onChangeText={setName}
              placeholder={t("activities.editTemplateScreen.templateNamePlaceholder")}
              label={t("activities.editTemplateScreen.templateNameLabel")}
            />
          </View>
          <View className="mb-5">
            <SubNotesInput
              value={notes}
              setValue={setNotes}
              placeholder={t("activities.editTemplateScreen.templateNotesPlaceholder")}
              label={t("activities.editTemplateScreen.templateNotesLabel")}
            />
          </View>
          <View className="mt-5">
            <AppText className="mb-2">
              {t("activities.editTemplateScreen.selectActivity")}
            </AppText>
            <AnimatedButton
              onPress={() => setShowDropdown(true)}
              label={getActivityName(selectedActivity)}
              className="bg-blue-800 py-2 w-full rounded-md shadow-md border-2 border-blue-500"
              textClassName="text-gray-100 text-center"
            />
          </View>
          <FullScreenModal
            isOpen={showDropdown}
            onClose={() => setShowDropdown(false)}
          >
            <AppText className="text-2xl text-center my-10">
              {t("activities.editTemplateScreen.selectActivity")}
            </AppText>
            <ActivityDropdown
              onSelect={(activity) => {
                setSelectedActivity(activity);
                setShowDropdown(false);
              }}
            />
            <View className="h-5" />
          </FullScreenModal>
        </View>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <DeleteButton
              onPress={() => {
                router.push("/activities/templates");
              }}
              label={t("activities.editTemplateScreen.cancelButton")}
              confirm={false}
            />
          </View>
          <View className="flex-1">
            <SaveButton onPress={handleSave} label={t("activities.editTemplateScreen.saveButton")} />
          </View>
        </View>
        <FullScreenLoader visible={isLoading} message={t("activities.editTemplateScreen.savingTemplate")} />
      </PageContainer>
    </TouchableWithoutFeedback>
  );
}
