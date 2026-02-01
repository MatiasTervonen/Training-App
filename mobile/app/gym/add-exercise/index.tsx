import AppInput from "@/components/AppInput";
import { useState } from "react";
import SaveButton from "@/components/buttons/SaveButton";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import SelectInput from "@/components/Selectinput";
import { addExercise } from "@/database/gym/add-exercise";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";
import { useTranslation } from "react-i18next";

export default function AddExercises() {
  const { t } = useTranslation(["gym", "common", "menu"]);
  const [name, setName] = useState("");
  const [exerciseLanguage, setExerciseLanguage] = useState("en");
  const [equipment, setEquipment] = useState("barbell");
  const [muscleGroup, setMuscleGroup] = useState("chest");
  const [mainGroup, setMainGroup] = useState("chest");
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!name) {
      Toast.show({
        type: "error",
        text1: t("gym.addExerciseScreen.nameRequired"),
      });
      return;
    }
    setIsSaving(true);

    const exerciseData = {
      name,
      language: exerciseLanguage,
      equipment,
      muscle_group: muscleGroup,
      main_group: mainGroup,
    };

    try {
      await addExercise(exerciseData);

      queryClient.refetchQueries({ queryKey: ["userExercises"], exact: true });
      Toast.show({
        type: "success",
        text1: t("gym.addExerciseScreen.saveSuccess"),
      });
      setName("");
    } catch {
      Toast.show({
        type: "error",
        text1: t("gym.addExerciseScreen.saveError"),
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
            <AppText className="text-2xl mb-5 text-center">
              {t("gym.addExerciseScreen.title")}
            </AppText>
            <AppInput
              value={name}
              setValue={setName}
              placeholder={t("gym.addExerciseScreen.exerciseNamePlaceholder")}
              label={t("gym.addExerciseScreen.exerciseName")}
            />
            <SelectInput
              topLabel={t("gym.addExerciseScreen.language")}
              value={exerciseLanguage}
              onChange={setExerciseLanguage}
              options={[
                { value: "en", label: t("menu:settings.languages.en") },
                { value: "fi", label: t("menu:settings.languages.fi") },
              ]}
              label={t("gym.addExerciseScreen.language")}
            />
            <SelectInput
              topLabel={t("gym.addExerciseScreen.equipment")}
              value={equipment}
              onChange={setEquipment}
              options={[
                { value: "barbell", label: t("gym.equipment.barbell") },
                { value: "dumbbell", label: t("gym.equipment.dumbbell") },
                { value: "machine", label: t("gym.equipment.machine") },
                { value: "smith", label: t("gym.equipment.smith") },
                { value: "cable", label: t("gym.equipment.cable") },
                { value: "rope", label: t("gym.equipment.rope") },
                { value: "bodyweight", label: t("gym.equipment.bodyweight") },
                { value: "gripper", label: t("gym.equipment.gripper") },
                { value: "band", label: t("gym.equipment.band") },
                { value: "ball", label: t("gym.equipment.ball") },
                { value: "wheel", label: t("gym.equipment.wheel") },
              ]}
              label={t("gym.addExerciseScreen.equipment")}
            />
            <SelectInput
              topLabel={t("gym.addExerciseScreen.muscleGroup")}
              value={muscleGroup}
              onChange={setMuscleGroup}
              options={[
                { value: "chest", label: t("gym.muscleGroups.chest") },
                { value: "quads", label: t("gym.muscleGroups.quads") },
                {
                  value: "hamstrings",
                  label: t("gym.muscleGroups.hamstrings"),
                },
                { value: "biceps", label: t("gym.muscleGroups.biceps") },
                { value: "triceps", label: t("gym.muscleGroups.triceps") },
                { value: "lats", label: t("gym.muscleGroups.lats") },
                { value: "abs", label: t("gym.muscleGroups.abs") },
                { value: "calves", label: t("gym.muscleGroups.calves") },
                {
                  value: "upper_back",
                  label: t("gym.muscleGroups.upper_back"),
                },
                { value: "forearms", label: t("gym.muscleGroups.forearms") },
                { value: "full_body", label: t("gym.muscleGroups.full_body") },
                {
                  value: "side_delts",
                  label: t("gym.muscleGroups.side_delts"),
                },
                { value: "legs", label: t("gym.muscleGroups.legs") },
                { value: "obliques", label: t("gym.muscleGroups.obliques") },
                {
                  value: "front_delts",
                  label: t("gym.muscleGroups.front_delts"),
                },
                { value: "traps", label: t("gym.muscleGroups.traps") },
              ]}
              label={t("gym.addExerciseScreen.muscleGroup")}
            />
            <SelectInput
              topLabel={t("gym.addExerciseScreen.mainGroup")}
              value={mainGroup}
              onChange={setMainGroup}
              options={[
                { value: "chest", label: t("gym.mainGroups.chest") },
                { value: "legs", label: t("gym.mainGroups.legs") },
                { value: "arms", label: t("gym.mainGroups.arms") },
                { value: "shoulders", label: t("gym.mainGroups.shoulders") },
                { value: "back", label: t("gym.mainGroups.back") },
                { value: "core", label: t("gym.mainGroups.core") },
                { value: "cardio", label: t("gym.mainGroups.cardio") },
              ]}
              label={t("gym.addExerciseScreen.mainGroup")}
            />
          </View>
          <View className="mt-10">
            <SaveButton
              onPress={handleSave}
              label={t("gym.addExerciseScreen.saveExercise")}
            />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
      <FullScreenLoader
        visible={isSaving}
        message={t("gym.addExerciseScreen.savingExercise")}
      />
    </>
  );
}
