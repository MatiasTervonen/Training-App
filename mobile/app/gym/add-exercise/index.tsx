import AppInput from "@/components/AppInput";
import { useState } from "react";
import SaveButton from "@/components/buttons/SaveButton";
import Toast from "react-native-toast-message";
import * as crypto from "expo-crypto";
import FullScreenLoader from "@/components/FullScreenLoader";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import SelectInput from "@/components/Selectinput";
import AddExercise from "@/database/gym/add-exercise";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";

export default function AddExercises() {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [equipment, setEquipment] = useState("barbell");
  const [muscleGroup, setMuscleGroup] = useState("chest");
  const [mainGroup, setMainGroup] = useState("chest");
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!name) {
      Toast.show({
        type: "error",
        text1: "Please enter an exercise name",
      });
      return;
    }
    setIsSaving(true);

    const exerciseData = {
      id: crypto.randomUUID(),
      name,
      language,
      equipment,
      muscle_group: muscleGroup,
      main_group: mainGroup,
    };

    try {
      await AddExercise(exerciseData);

      queryClient.refetchQueries({ queryKey: ["userExercises"], exact: true });
      Toast.show({
        type: "success",
        text1: "Exercise saved successfully!",
      });
      setName("");
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to save exercise. Please try again.",
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
              Add Exercises
            </AppText>
            <AppInput
              value={name}
              setValue={setName}
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
              topLabel="Muscle group"
              value={muscleGroup}
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
              ]}
              label="Muscle group"
            />
            <SelectInput
              topLabel="Main group"
              value={mainGroup}
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
          </View>
          <View className="mt-10">
            <SaveButton onPress={handleSave} label="Save Exercise" />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message="Saving exercise..." />
    </>
  );
}
