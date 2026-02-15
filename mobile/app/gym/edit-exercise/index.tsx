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
import SelectInput from "@/components/Selectinput";
import { gym_exercises } from "@/types/models";
import { editExercise } from "@/database/gym/edit-exercise";
import { deleteExercise } from "@/database/gym/delete-exercise";
import ExerciseDropdownEdit from "@/features/gym/components/ExerciseDropDownEdit";
import DeleteButton from "@/components/buttons/DeleteButton";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";
import { useTranslation } from "react-i18next";

type Exercise = {
  id: string;
  name: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export default function EditExercises() {
  const { t } = useTranslation("gym");
  const [name, setName] = useState("");
  const [equipment, setEquipment] = useState("");
  const [muscle_group, setMuscleGroup] = useState("");
  const [main_group, setMainGroup] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  const handleUpdateExercise = async () => {
    if (!name || !equipment || !muscle_group || !main_group) {
      Toast.show({
        type: "error",
        text1: t("gym.editExerciseScreen.fillAllFields"),
      });
      return;
    }
    setIsSaving(true);

    const exerciseData = {
      id: selectedExercise!.id,
      name,
      equipment,
      muscle_group,
      main_group,
    };

    try {
      await editExercise(exerciseData);

      await queryClient.invalidateQueries({
        queryKey: ["userExercises"],
        exact: true,
      });
      Toast.show({
        type: "success",
        text1: t("gym.editExerciseScreen.updateSuccess"),
      });
      resetFields();
    } catch {
      Toast.show({
        type: "error",
        text1: t("gym.editExerciseScreen.updateError"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    setIsDeleting(true);
    setIsSaving(true);

    try {
      await deleteExercise(exerciseId);

      await queryClient.invalidateQueries({
        queryKey: ["userExercises"],
        exact: true,
      });
      Toast.show({
        type: "success",
        text1: t("gym.editExerciseScreen.deleteSuccess"),
      });
      setSelectedExercise(null);
    } catch {
      Toast.show({
        type: "error",
        text1: t("gym.editExerciseScreen.deleteError"),
      });
    } finally {
      setIsDeleting(false);
      setIsSaving(false);
    }
  };

  const resetFields = () => {
    setName("");
    setEquipment("");
    setMuscleGroup("");
    setMainGroup("");
    setSelectedExercise(null);
  };

  if (!selectedExercise) {
    return (
      <ExerciseDropdownEdit
        onSelect={(exercise) => {
          const ex = exercise as gym_exercises;
          setSelectedExercise(ex);
          setName(ex.name);
          setEquipment(ex.equipment);
          setMuscleGroup(ex.muscle_group);
          setMainGroup(ex.main_group);
        }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <PageContainer className="justify-between">
          <View className="gap-4">
            <AppText className="text-2xl text-center mb-5">
              {t("gym.editExerciseScreen.title")}
            </AppText>
            <AppInput
              value={name}
              setValue={setName}
              placeholder={t("gym.addExerciseScreen.exerciseNamePlaceholder")}
              label={t("gym.addExerciseScreen.exerciseName")}
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
              value={muscle_group}
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
                { value: "delts", label: t("gym.muscleGroups.delts") },
                {
                  value: "lower_back",
                  label: t("gym.muscleGroups.lower_back"),
                },
              ]}
              label={t("gym.addExerciseScreen.muscleGroup")}
            />
            <SelectInput
              topLabel={t("gym.addExerciseScreen.mainGroup")}
              value={main_group}
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
          <View className="mt-20 flex flex-col gap-5">
            <View className="flex-row gap-4">
              <View className="flex-1">
                <DeleteButton
                  onPress={() => handleDeleteExercise(selectedExercise.id)}
                  label={t("gym.editExerciseScreen.deleteExercise")}
                />
              </View>
              <View className="flex-1">
                <SaveButton
                  onPress={handleUpdateExercise}
                  label={t("gym.editExerciseScreen.updateExercise")}
                />
              </View>
            </View>
            <AnimatedButton
              onPress={() => {
                resetFields();
              }}
              label={t("common:common.cancel")}
              className="bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500 text-lg items-center"
              textClassName="text-gray-100"
            />
          </View>

          <FullScreenLoader
            visible={isSaving}
            message={
              isDeleting
                ? t("gym.editExerciseScreen.deletingExercise")
                : t("gym.editExerciseScreen.savingExercise")
            }
          />
        </PageContainer>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}
