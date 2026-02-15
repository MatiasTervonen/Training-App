import AppInput from "@/components/AppInput";
import { useState, useCallback } from "react";
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
import ActivityDropdownEdit from "@/features/activities/components/activityDropdownEdit";
import { deleteActivity } from "@/database/activities/delete-activity";
import DeleteButton from "@/components/buttons/DeleteButton";
import AnimatedButton from "@/components/buttons/animatedButton";
import CategoryDropdown from "@/features/activities/components/categoryDropDown";
import FullScreenModal from "@/components/FullScreenModal";
import { UserActivity } from "@/database/activities/get-user-activities";
import { useTranslation } from "react-i18next";

export default function EditActivity() {
  const { t } = useTranslation("activities");
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

  const getCategoryName = useCallback(
    (slug: string | null | undefined, fallbackName: string) => {
      if (slug) {
        const translated = t(`activities.categories.${slug}`, {
          defaultValue: "",
        });
        if (translated && translated !== `activities.categories.${slug}`) {
          return translated;
        }
      }
      return fallbackName;
    },
    [t],
  );

  const handleSave = async () => {
    if (!name) {
      Toast.show({
        type: "error",
        text1: t("activities.editActivityScreen.errorNameRequired"),
      });
      return;
    }

    if (!category) {
      Toast.show({
        type: "error",
        text1: t("activities.editActivityScreen.errorCategoryRequired"),
      });
      return;
    }

    const metValue = parseFloat(met);

    // Validate MET value
    if (!met || met === "." || isNaN(metValue)) {
      Toast.show({
        type: "error",
        text1: t("activities.editActivityScreen.errorInvalidMet"),
        text2: t("activities.editActivityScreen.errorInvalidMetDesc"),
      });
      return;
    }

    if (metValue < 1 || metValue > 20) {
      Toast.show({
        type: "error",
        text1: t("activities.editActivityScreen.errorMetOutOfRange"),
        text2: t("activities.editActivityScreen.errorMetRangeDesc"),
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

      queryClient.invalidateQueries({ queryKey: ["userActivities"], exact: true });
      Toast.show({
        type: "success",
        text1: t("activities.editActivityScreen.successEdited"),
      });
      resetFields();
    } catch {
      Toast.show({
        type: "error",
        text1: t("activities.editActivityScreen.errorEditFailed"),
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

      await queryClient.invalidateQueries({
        queryKey: ["userActivities"],
        exact: true,
      });
      Toast.show({
        type: "success",
        text1: t("activities.editActivityScreen.successDeleted"),
      });
      setSelectedActivity(null);
    } catch {
      Toast.show({
        type: "error",
        text1: t("activities.editActivityScreen.errorDeleteFailed"),
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
            setCategory(
              getCategoryName(
                activity.activity_categories?.slug,
                activity.activity_categories?.name ?? "",
              ),
            );
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <PageContainer className="justify-between flex-1">
              <View>
                <AppText className="text-2xl mb-10 text-center">
                  {t("activities.editActivityScreen.title")}
                </AppText>
                <View className="mb-5">
                  <AppInput
                    value={name}
                    setValue={setName}
                    placeholder={t("activities.editActivityScreen.activityNamePlaceholder")}
                    label={t("activities.editActivityScreen.activityNameLabel")}
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
                    placeholder={t("activities.editActivityScreen.metPlaceholder")}
                    label={t("activities.editActivityScreen.metLabel")}
                  />
                  <AppText className="text-gray-400 text-sm mt-1">
                    {t("activities.editActivityScreen.metDescription")}
                  </AppText>
                </View>
                <AnimatedButton
                  onPress={() => setOpenCategoryModal(true)}
                  label={category || t("activities.editActivityScreen.selectCategory")}
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
                      setCategory(getCategoryName(category.slug, category.name));
                      setOpenCategoryModal(false);
                    }}
                  />
                </FullScreenModal>
              </View>
              <View className="mt-20 flex flex-col gap-5">
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <DeleteButton
                      onPress={() => handleDeleteActivity(selectedActivity!.id)}
                      label={t("activities.editActivityScreen.deleteButton")}
                    />
                  </View>
                  <View className="flex-1">
                    <SaveButton onPress={handleSave} label={t("activities.editActivityScreen.updateButton")} />
                  </View>
                </View>
                <AnimatedButton
                  onPress={() => {
                    resetFields();
                  }}
                  label={t("activities.editActivityScreen.cancelButton")}
                  className="bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500 text-lg items-center"
                  textClassName="text-gray-100"
                />
              </View>
            </PageContainer>
          </TouchableWithoutFeedback>
          <FullScreenLoader
            visible={isSaving}
            message={isDeleting ? t("activities.editActivityScreen.deletingActivity") : t("activities.editActivityScreen.savingActivity")}
          />
        </ScrollView>
      )}
    </>
  );
}
