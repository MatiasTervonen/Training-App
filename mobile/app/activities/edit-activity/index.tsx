import AppInput from "@/components/AppInput";
import { useEffect, useState } from "react";
import SaveButton from "@/components/buttons/SaveButton";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import { View, TouchableWithoutFeedback, Keyboard, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";
import { editActivity } from "@/database/activities/edit-activity";
import ActivityDropdownEdit from "@/Features/activities/components/activityDropdownEdit";
import { deleteActivity } from "@/database/activities/delete-activity";
import DeleteButton from "@/components/buttons/DeleteButton";
import AnimatedButton from "@/components/buttons/animatedButton";
import CategoryDropdown from "@/Features/activities/components/categoryDropDown";
import FullScreenModal from "@/components/FullScreenModal";

type Activity = {
  id: string;
  name: string;
  category: string;
};

export default function EditActivity() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cardio");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
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
      id: selectedActivity!.id,
    };

    try {
      await editActivity(activityData);

      queryClient.refetchQueries({ queryKey: ["userActivities"], exact: true });
      Toast.show({
        type: "success",
        text1: "Activity edited successfully!",
      });
      setName("");
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to edit activity. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleDeleteActivity = async (activityId: string) => {
    setIsDeleting(true);
    setIsSaving(true);

    try {
      await deleteActivity(activityId);

      await queryClient.refetchQueries({
        queryKey: ["userActivities"],
        exact: true,
      });
      Toast.show({
        type: "success",
        text1: "Activity deleted successfully!",
      });
      setSelectedActivity(null);
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to delete activity. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (selectedActivity) {
      setName(selectedActivity.name);
      setCategory(selectedActivity.category);
    }
  }, [selectedActivity]);

  const resetFields = () => {
    setName("");
    setCategory("Cardio");
    setSelectedActivity(null);
  };


  return (
    <>
      {!selectedActivity ? (
        <ActivityDropdownEdit
          onSelect={(activity) => {
            setSelectedActivity(activity);
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <PageContainer className="justify-between flex-1">
              <View className="gap-4">
                <AppText className="text-2xl mb-10 text-center">
                  Edit Activity
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
              <View className="mt-20 flex flex-col gap-5">
                <SaveButton onPress={handleSave} label="Update Exercise" />
                <DeleteButton
                  onPress={() => handleDeleteActivity(selectedActivity!.id)}
                  label="Delete Activity"
                />
                <AnimatedButton
                  onPress={() => {
                    resetFields();
                  }}
                  label="Cancel"
                  className="bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500 text-lg items-center"
                  textClassName="text-gray-100"
                />
              </View>
            </PageContainer>
          </TouchableWithoutFeedback>
          <FullScreenLoader visible={isSaving} message={isDeleting ? "Deleting activity..." : "Saving activity..."} />
        </ScrollView>
      )}
    </>
  );
}
