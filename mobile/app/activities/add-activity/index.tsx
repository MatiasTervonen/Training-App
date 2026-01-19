import AppInput from "@/components/AppInput";
import { useState } from "react";
import SaveButton from "@/components/buttons/SaveButton";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";
import { addActivity } from "@/database/activities/add-activity";

import CategoryDropdown from "@/Features/activities/components/categoryDropDown";
import FullScreenModal from "@/components/FullScreenModal";
import AnimatedButton from "@/components/buttons/animatedButton";

export default function AddActivity() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);

  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!name) {
      Toast.show({
        type: "error",
        text1: "Please enter an activity name",
      });
      return;
    }
    setIsSaving(true);

    const activityData = {
      name,
      category,
    };

    try {
      await addActivity(activityData);

      queryClient.refetchQueries({ queryKey: ["userActivities"], exact: true });
      
      Toast.show({
        type: "success",
        text1: "Activity saved successfully!",
      });
      setName("");
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to save activity. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <PageContainer className="justify-between flex-1">
          <View className="gap-4">
            <AppText className="text-2xl mb-10 text-center">
              Add Activity
            </AppText>
            <View className="mb-5">
              <AppInput
                value={name}
                setValue={setName}
                placeholder="Activity name"
                label="Activity Name"
              />
            </View>
            <AnimatedButton
              onPress={() => setOpenCategoryModal(true)}
              label={category || "Select Category"}
              className="bg-blue-800 py-2 w-full rounded-md shadow-md border-2 border-blue-500"
              textClassName="text-gray-100 text-center"
            />
            <FullScreenModal
              isOpen={openCategoryModal}
              onClose={() => setOpenCategoryModal(false)}
            >
              <CategoryDropdown onSelect={(category) => {
                setCategory(category.name);
                setOpenCategoryModal(false);
              }} />
            </FullScreenModal>
          </View>
          <View className="mt-10">
            <SaveButton onPress={handleSave} label="Save Activity" />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message="Saving activity..." />
    </>
  );
}
