import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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

export default function ActivityTemplateEditScreen() {
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

  const handleSave = async () => {
    if (!templateId) return;

    if (name.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Error saving template",
        text2: "Please enter a template name",
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

      queryClient.refetchQueries({
        queryKey: ["get-activity-templates"],
        exact: true,
      });

      Toast.show({
        type: "success",
        text1: "Template saved",
        text2: "Template has been saved successfully.",
      });
      router.push("/activities/templates");
    } catch (error) {
      console.error("Error saving template", error);
      Toast.show({
        type: "error",
        text1: "Error saving template",
        text2: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!template) {
    return (
      <PageContainer>
        <AppText className="text-2xl text-center mb-10">Edit Template</AppText>
        <AppText className="text-center text-red-500 mt-20">
          Template not found
        </AppText>
      </PageContainer>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <PageContainer className="justify-between">
        <View>
          <AppText className="text-2xl text-center mb-10">
            Edit Template
          </AppText>
          <View className="mb-5">
            <AppInput
              value={name}
              onChangeText={setName}
              placeholder="Template Name..."
              label="Template Name..."
            />
          </View>
          <View className="mb-5">
            <SubNotesInput
              value={notes}
              setValue={setNotes}
              placeholder="Template Notes..."
              label="Template Notes..."
              className="min-h-[60px]"
            />
          </View>
          <View className="mt-5">
            <AppText className="mb-2">Select Activity</AppText>
            <AnimatedButton
              onPress={() => setShowDropdown(true)}
              label={
                selectedActivity ? selectedActivity.name : "Select Activity"
              }
              className="bg-blue-800 py-2 w-full rounded-md shadow-md border-2 border-blue-500"
              textClassName="text-gray-100 text-center"
            />
          </View>
          <FullScreenModal
            isOpen={showDropdown}
            onClose={() => setShowDropdown(false)}
          >
            <AppText className="text-2xl text-center my-10">
              Select Activity
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
        <View className="gap-5">
          <SaveButton onPress={handleSave} label="Save Template" />
          <DeleteButton
            onPress={() => {
              router.push("/activities/templates");
            }}
            label="Cancel"
            confirm={false}
          />
        </View>
        <FullScreenLoader visible={isLoading} message="Saving template..." />
      </PageContainer>
    </TouchableWithoutFeedback>
  );
}
