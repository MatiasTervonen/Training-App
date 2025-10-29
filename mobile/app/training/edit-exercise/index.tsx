import AppInput from "@/components/AppInput";
import { useState, useEffect } from "react";
import SaveButton from "@/components/buttons/SaveButton";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import { handleError } from "@/utils/handleError";
import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import AppText from "@/components/AppText";
import SelectInput from "@/components/Selectinput";
import { gym_exercises } from "@/types/models";
import EditExercise from "@/api/gym/edit-exercise";
import DeleteExercise from "@/api/gym/delete-exercise";
import ExerciseDropdownEdit from "@/components/gym/ExerciseDropDownEdit";
import DeleteButton from "@/components/buttons/DeleteButton";
import AnimatedButton from "@/components/animatedButton";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";

type Exercise = {
  id: string;
  name: string;
  language: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
};

export default function EditExercises() {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");
  const [equipment, setEquipment] = useState("");
  const [muscle_group, setMuscleGroup] = useState("");
  const [main_group, setMainGroup] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [resetTrigger, setResetTrigger] = useState(0);

  const queryClient = useQueryClient();

  const handleUpdateExercise = async () => {
    if (!name || !equipment || !muscle_group || !main_group) {
      Toast.show({
        type: "error",
        text1: "Please fill in all fields.",
      });
      return;
    }
    setIsSaving(true);

    const exerciseData = {
      id: selectedExercise!.id,
      name,
      language,
      equipment,
      muscle_group,
      main_group,
    };

    const queryKey = ["userExercises"];

    const previousData = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<Exercise[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      return oldData.map((exercise) =>
        exercise.id === selectedExercise!.id
          ? { ...exercise, ...exerciseData }
          : exercise
      );
    });

    try {
      await EditExercise(exerciseData);

      Toast.show({
        type: "success",
        text1: "Exercise updated successfully!",
      });
      resetFields();
    } catch (error) {
      queryClient.setQueryData(queryKey, previousData);
      console.error("Error updating exercise:", error);
      handleError(error, {
        message: "Error updating exercise",
        route: "/api/gym/edit-exercise",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: "Failed to update exercise. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    const queryKey = ["userExercises"];

    const previousData = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<Exercise[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return oldData.filter((exercise) => exercise.id !== exerciseId);
    });

    try {
      await DeleteExercise(exerciseId);

      Toast.show({
        type: "success",
        text1: "Exercise deleted successfully!",
      });
      setSelectedExercise(null);
      setResetTrigger((prev) => prev + 1);
    } catch (error) {
      queryClient.setQueryData(queryKey, previousData);
      handleError(error, {
        message: "Error deleting exercise",
        route: "/api/gym/delete-exercise",
        method: "DELETE",
      });
      Toast.show({
        type: "error",
        text1: "Failed to delete exercise. Please try again.",
      });
    }
  };

  useEffect(() => {
    if (selectedExercise) {
      setName(selectedExercise.name);
      setLanguage(selectedExercise.language);
      setEquipment(selectedExercise.equipment);
      setMuscleGroup(selectedExercise.muscle_group);
      setMainGroup(selectedExercise.main_group);
    }
  }, [selectedExercise]);

  const resetFields = () => {
    setName("");
    setLanguage("");
    setEquipment("");
    setMuscleGroup("");
    setMainGroup("");
    setSelectedExercise(null);
    setResetTrigger((prev) => prev + 1);
  };

  if (!selectedExercise) {
    return (
      <ExerciseDropdownEdit
        onSelect={(exercise) => {
          setSelectedExercise(exercise as gym_exercises);
        }}
        resetTrigger={resetTrigger}
      />
    );
  }

  return (
    <ScrollView>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <PageContainer className="gap-4">
            <AppText className="text-2xl text-center my-5">
              Edit exercise
            </AppText>
            <AppInput
              value={name}
              onChangeText={setName}
              placeholder="Exercise name"
              label="Exercise Name"
            />
            <SelectInput
              topLabel="Language"
              value={language}
              onChange={setLanguage}
              options={[
                { value: "en", label: "English" },
                { value: "fi", label: "Finland" },
              ]}
              label="Language"
            />
            <SelectInput
              topLabel="Equipment"
              value={equipment}
              onChange={setEquipment}
              options={[
                { value: "barbell", label: "Barbell" },
                { value: "dumbbell", label: "Dumbbell" },
                { value: "machine", label: "Machine" },
                { value: "smith", label: "Smith" },
                { value: "cable", label: "Cable" },
                { value: "rope", label: "Rope" },
                { value: "bodyweight", label: "Bodyweight" },
                { value: "gripper", label: "Gripper" },
                { value: "band", label: "Band" },
                { value: "ball", label: "Ball" },
                { value: "wheel", label: "Wheel" },
              ]}
              label="Equipment"
            />

            <SelectInput
              topLabel="Muscle Group"
              value={muscle_group}
              onChange={setMuscleGroup}
              options={[
                { value: "chest", label: "Chest" },
                { value: "quads", label: "Quads" },
                { value: "hamstrings", label: "Hamstrings" },
                { value: "biceps", label: "Biceps" },
                { value: "triceps", label: "Triceps" },
                { value: "lats", label: "Lats" },
                { value: "abs", label: "Abs" },
                { value: "calves", label: "Calves" },
                { value: "upper_back", label: "Upper back" },
                { value: "forearms", label: "Forearms" },
                { value: "full_body", label: "Full body" },
                { value: "side_delts", label: "Side delts" },
                { value: "legs", label: "Legs" },
                { value: "obliques", label: "Obliques" },
                { value: "front_delts", label: "Front delts" },
                { value: "traps", label: "Traps" },
                { value: "delts", label: "Delts" },
                { value: "lower_back", label: "Lower back" },
              ]}
              label="Muscle group"
            />
            <SelectInput
              topLabel="Main Group"
              value={main_group}
              onChange={setMainGroup}
              options={[
                { value: "chest", label: "Chest" },
                { value: "legs", label: "Legs" },
                { value: "arms", label: "Arms" },
                { value: "shoulders", label: "Shoulders" },
                { value: "back", label: "Back" },
                { value: "core", label: "Core" },
                { value: "cardio", label: "Cardio" },
              ]}
              label="Main group"
            />
            <View className="mt-20 flex flex-col gap-5">
              <SaveButton
                onPress={handleUpdateExercise}
                label="Update Exercise"
              />
              <DeleteButton
                onPress={() => handleDeleteExercise(selectedExercise.id)}
                label="Delete Exercise"
              />
              <AnimatedButton
                onPress={() => {
                  resetFields();
                }}
                label="Cancel"
                className="mb-10 bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500 text-lg items-center"
              />
            </View>
          
          <FullScreenLoader visible={isSaving} message="Saving exercise..." />
        </PageContainer>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}
