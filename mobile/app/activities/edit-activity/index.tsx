import AppInput from "@/components/AppInput";
import { useState } from "react";
import SaveButton from "@/components/buttons/SaveButton";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
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
import { UserActivity } from "@/database/activities/get-user-activities";

export default function EditActivity() {
  const [name, setName] = useState("");
  const [met, setMet] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(
    null,
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

    if (!category) {
      Toast.show({
        type: "error",
        text1: "Please select a category",
      });
      return;
    }

    const metValue = parseFloat(met);

    // Validate MET value
    if (!met || met === "." || isNaN(metValue)) {
      Toast.show({
        type: "error",
        text1: "Invalid MET value",
        text2: "Please enter a valid number",
      });
      return;
    }

    if (metValue < 1 || metValue > 20) {
      Toast.show({
        type: "error",
        text1: "MET out of range",
        text2: "Please enter a value between 1.0 and 20.0",
      });
      return;
    }

    // Round to 2 decimals for consistency
    const finalMet = Number(metValue.toFixed(2));

    setIsSaving(true);

    const activityData = {
      name,
      base_met: finalMet,
      category_id: categoryId,
      id: selectedActivity!.id,
    };

    try {
      await editActivity(activityData);

      queryClient.refetchQueries({ queryKey: ["userActivities"], exact: true });
      Toast.show({
        type: "success",
        text1: "Activity edited successfully!",
      });
      resetFields();
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

  const resetFields = () => {
    setName("");
    setMet("");
    setCategory("");
    setCategoryId("");
    setSelectedActivity(null);
  };

  return (
    <>
      {!selectedActivity ? (
        <ActivityDropdownEdit
          onSelect={(activity) => {
            setSelectedActivity(activity);
            setName(activity.name);
            setMet(activity.base_met?.toString() ?? "");
            setCategoryId(activity.category_id ?? "");
            setCategory(activity.activity_categories?.name ?? "");
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <PageContainer className="justify-between flex-1">
              <View>
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
                <View className="mb-5">
                  <AppInput
                    value={met}
                    setValue={(text) => {
                      // Only allow numbers and decimal point
                      if (/^\d*\.?\d{0,2}$/.test(text) || text === "") {
                        const numValue = parseFloat(text);

                        if (text === "" || (numValue >= 1 && numValue <= 20)) {
                          setMet(text);
                        }
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="e.g. 8.0"
                    label="MET"
                  />
                  <AppText className="text-gray-400 text-sm mt-1">
                    Used to estimate calories burned during the activity.
                    Example: Rest 1.0 walking 3.5, running 7.5
                  </AppText>
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
                  <CategoryDropdown
                    onSelect={(category) => {
                      setCategoryId(category.id);
                      setCategory(category.name);
                      setOpenCategoryModal(false);
                    }}
                  />
                </FullScreenModal>
              </View>
              <View className="mt-20 flex flex-col gap-5">
                <SaveButton onPress={handleSave} label="Update Activity" />
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
          <FullScreenLoader
            visible={isSaving}
            message={isDeleting ? "Deleting activity..." : "Saving activity..."}
          />
        </ScrollView>
      )}
    </>
  );
}
