import AppInput from "@/components/AppInput";
import { useState, useCallback, useMemo } from "react";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import AppText from "@/components/AppText";
import Toggle from "@/components/toggle";
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
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import { useAutoSave } from "@/hooks/useAutoSave";

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
  const [isGpsRelevant, setIsGpsRelevant] = useState(true);
  const [isStepRelevant, setIsStepRelevant] = useState(true);
  const [isCaloriesRelevant, setIsCaloriesRelevant] = useState(true);

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

  const autoSaveData = useMemo(
    () => ({
      name,
      met,
      categoryId,
      isGpsRelevant,
      isStepRelevant,
      isCaloriesRelevant,
    }),
    [name, met, categoryId, isGpsRelevant, isStepRelevant, isCaloriesRelevant],
  );

  const handleAutoSave = useCallback(async () => {
    if (!name) {
      throw new Error("Name is required");
    }
    if (!categoryId) {
      throw new Error("Category is required");
    }

    const metValue = parseFloat(met);
    if (!met || met === "." || isNaN(metValue)) {
      throw new Error("Invalid MET value");
    }
    if (metValue < 1 || metValue > 20) {
      throw new Error("MET value out of range");
    }

    const finalMet = Number(metValue.toFixed(2));

    await editActivity({
      name,
      base_met: finalMet,
      category_id: categoryId,
      id: selectedActivity!.id,
      is_gps_relevant: isGpsRelevant,
      is_step_relevant: isStepRelevant,
      is_calories_relevant: isCaloriesRelevant,
    });

    queryClient.invalidateQueries({
      queryKey: ["userActivities"],
      exact: true,
    });
  }, [
    name,
    met,
    categoryId,
    isGpsRelevant,
    isStepRelevant,
    isCaloriesRelevant,
    selectedActivity,
    queryClient,
  ]);

  const { status } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: !!selectedActivity,
  });

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
    setIsGpsRelevant(true);
    setIsStepRelevant(true);
    setIsCaloriesRelevant(true);
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
            setIsGpsRelevant(activity.is_gps_relevant);
            setIsStepRelevant(activity.is_step_relevant);
            setIsCaloriesRelevant(activity.is_calories_relevant);
          }}
        />
      ) : (
        <View className="flex-1">
          <AutoSaveIndicator status={status} />
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
                      placeholder={t(
                        "activities.editActivityScreen.activityNamePlaceholder",
                      )}
                      label={t(
                        "activities.editActivityScreen.activityNameLabel",
                      )}
                    />
                  </View>
                  <View className="mb-5">
                    <AppInput
                      value={met}
                      setValue={(text) => {
                        // Only allow numbers and decimal point
                        if (/^\d*\.?\d{0,2}$/.test(text) || text === "") {
                          const numValue = parseFloat(text);

                          if (
                            text === "" ||
                            (numValue >= 1 && numValue <= 20)
                          ) {
                            setMet(text);
                          }
                        }
                      }}
                      keyboardType="numeric"
                      placeholder={t(
                        "activities.editActivityScreen.metPlaceholder",
                      )}
                      label={t("activities.editActivityScreen.metLabel")}
                    />
                    <AppText className="text-gray-400 text-sm mt-1">
                      {t("activities.editActivityScreen.metDescription")}
                    </AppText>
                  </View>
                  <AnimatedButton
                    onPress={() => setOpenCategoryModal(true)}
                    label={
                      category ||
                      t("activities.editActivityScreen.selectCategory")
                    }
                    className="btn-add"
                  />
                  <FullScreenModal
                    isOpen={openCategoryModal}
                    onClose={() => setOpenCategoryModal(false)}
                  >
                    <CategoryDropdown
                      onSelect={(category) => {
                        setCategoryId(category.id);
                        setCategory(
                          getCategoryName(category.slug, category.name),
                        );
                        setOpenCategoryModal(false);
                      }}
                    />
                  </FullScreenModal>
                  <View className="mt-8">
                    <AppText className="text-lg mb-4">
                      {t("activities.editActivityScreen.trackingOptions")}
                    </AppText>
                    <View className="flex-row items-center justify-between mb-3 px-2">
                      <AppText>
                        {t("activities.editActivityScreen.gpsTracking")}
                      </AppText>
                      <Toggle
                        isOn={isGpsRelevant}
                        onToggle={() => setIsGpsRelevant((prev) => !prev)}
                      />
                    </View>
                    <View className="flex-row items-center justify-between mb-3 px-2">
                      <AppText>
                        {t("activities.editActivityScreen.stepsTracking")}
                      </AppText>
                      <Toggle
                        isOn={isStepRelevant}
                        onToggle={() => setIsStepRelevant((prev) => !prev)}
                      />
                    </View>
                    <View className="flex-row items-center justify-between mb-3 px-2">
                      <AppText>
                        {t("activities.editActivityScreen.caloriesTracking")}
                      </AppText>
                      <Toggle
                        isOn={isCaloriesRelevant}
                        onToggle={() => setIsCaloriesRelevant((prev) => !prev)}
                      />
                    </View>
                  </View>
                </View>
                <View className="mt-20 flex flex-col gap-5">
                  <DeleteButton
                    onPress={() => handleDeleteActivity(selectedActivity!.id)}
                    label={t("activities.editActivityScreen.deleteButton")}
                  />
                  <AnimatedButton
                    onPress={() => {
                      resetFields();
                    }}
                    label={t("activities.editActivityScreen.cancelButton")}
                    className="btn-neutral"
                  />
                </View>
              </PageContainer>
            </TouchableWithoutFeedback>
            <FullScreenLoader
              visible={isSaving}
              message={
                isDeleting
                  ? t("activities.editActivityScreen.deletingActivity")
                  : t("activities.editActivityScreen.savingActivity")
              }
            />
          </ScrollView>
        </View>
      )}
    </>
  );
}
