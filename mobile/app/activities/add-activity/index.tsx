import AppInput from "@/components/AppInput";
import { useState } from "react";
import SaveButton from "@/components/buttons/SaveButton";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import { View, TouchableWithoutFeedback, Keyboard, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import Toggle from "@/components/toggle";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";
import { addActivity } from "@/database/activities/add-activity";

import CategoryDropdown from "@/features/activities/components/categoryDropDown";
import FullScreenModal from "@/components/FullScreenModal";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";

export default function AddActivity() {
  const { t } = useTranslation("activities");
  const [name, setName] = useState("");
  const [met, setMet] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [isGpsRelevant, setIsGpsRelevant] = useState(true);
  const [isStepRelevant, setIsStepRelevant] = useState(true);
  const [isCaloriesRelevant, setIsCaloriesRelevant] = useState(true);

  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!name) {
      Toast.show({
        type: "error",
        text1: t("activities.addActivityScreen.errorNameRequired"),
      });
      return;
    }

    if (!category) {
      Toast.show({
        type: "error",
        text1: t("activities.addActivityScreen.errorCategoryRequired"),
      });
      return;
    }

    const metValue = parseFloat(met);

    // Validate MET value
    if (!met || met === "." || isNaN(metValue)) {
      Toast.show({
        type: "error",
        text1: t("activities.addActivityScreen.errorInvalidMet"),
        text2: t("activities.addActivityScreen.errorInvalidMetDesc"),
      });
      return;
    }

    if (metValue < 1 || metValue > 20) {
      Toast.show({
        type: "error",
        text1: t("activities.addActivityScreen.errorMetOutOfRange"),
        text2: t("activities.addActivityScreen.errorMetRangeDesc"),
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
      is_gps_relevant: isGpsRelevant,
      is_step_relevant: isStepRelevant,
      is_calories_relevant: isCaloriesRelevant,
    };

    try {
      await addActivity(activityData);

      queryClient.invalidateQueries({ queryKey: ["userActivities"], exact: true });

      Toast.show({
        type: "success",
        text1: t("activities.addActivityScreen.successSaved"),
      });
      setName("");
      setMet("");
      setCategory("");
      setCategoryId("");
      setIsGpsRelevant(true);
      setIsStepRelevant(true);
      setIsCaloriesRelevant(true);
    } catch {
      Toast.show({
        type: "error",
        text1: t("activities.addActivityScreen.errorSaveFailed"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <PageContainer className="justify-between flex-1">
            <View>
              <AppText className="text-2xl mb-10 text-center">
                {t("activities.addActivityScreen.title")}
              </AppText>
              <View className="mb-5">
                <AppInput
                  value={name}
                  setValue={setName}
                  placeholder={t(
                    "activities.addActivityScreen.activityNamePlaceholder",
                  )}
                  label={t("activities.addActivityScreen.activityNameLabel")}
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
                  placeholder={t("activities.addActivityScreen.metPlaceholder")}
                  label={t("activities.addActivityScreen.metLabel")}
                />
                <AppText className="text-gray-400 text-sm mt-1">
                  {t("activities.addActivityScreen.metDescription")}
                </AppText>
              </View>
              <AppText className="mb-2">
                {t("activities.addActivityScreen.selectCategory")}
              </AppText>
              <AnimatedButton
                onPress={() => setOpenCategoryModal(true)}
                label={
                  category || t("activities.addActivityScreen.selectCategory")
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
                    setCategory(category.name);
                    setOpenCategoryModal(false);
                  }}
                />
              </FullScreenModal>
              <View className="mt-8">
                <AppText className="text-lg mb-4">
                  {t("activities.addActivityScreen.trackingOptions")}
                </AppText>
                <View className="flex-row items-center justify-between mb-5 px-2">
                  <AppText>{t("activities.addActivityScreen.gpsTracking")}</AppText>
                  <Toggle isOn={isGpsRelevant} onToggle={() => setIsGpsRelevant((prev) => !prev)} />
                </View>
                <View className="flex-row items-center justify-between mb-5 px-2">
                  <AppText>{t("activities.addActivityScreen.stepsTracking")}</AppText>
                  <Toggle isOn={isStepRelevant} onToggle={() => setIsStepRelevant((prev) => !prev)} />
                </View>
                <View className="flex-row items-center justify-between mb-5 px-2">
                  <AppText>{t("activities.addActivityScreen.caloriesTracking")}</AppText>
                  <Toggle isOn={isCaloriesRelevant} onToggle={() => setIsCaloriesRelevant((prev) => !prev)} />
                </View>
              </View>
            </View>
            <View className="mt-10">
              <SaveButton
                onPress={handleSave}
                label={t("activities.addActivityScreen.saveButton")}
              />
            </View>
          </PageContainer>
        </TouchableWithoutFeedback>
      </ScrollView>
      <FullScreenLoader
        visible={isSaving}
        message={t("activities.addActivityScreen.savingActivity")}
      />
    </>
  );
}
