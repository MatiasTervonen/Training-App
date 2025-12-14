"use client";

import CustomInput from "@/app/(app)/ui/CustomInput";
import { useState } from "react";
import ExerciseTypeSelect from "@/app/(app)/training/components/ExerciseTypeSelect";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import toast from "react-hot-toast";
import { generateUUID } from "@/app/(app)/lib/generateUUID";
import FullScreenLoader from "../../components/FullScreenLoader";
import { saveExerciseToDB } from "../../database/admin";
import { useQueryClient } from "@tanstack/react-query";

export default function EditExercises() {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [equipment, setEquipment] = useState("barbell");
  const [muscleGroup, setMuscleGroup] = useState("chest");
  const [mainGroup, setMainGroup] = useState("chest");
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!name || !equipment || !muscleGroup || !mainGroup) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (name.length >= 50) return;

    setIsSaving(true);

    const exerciseData = {
      id: generateUUID(),
      name,
      language,
      equipment,
      muscle_group: muscleGroup,
      main_group: mainGroup,
    };

    try {
      await saveExerciseToDB(exerciseData);

      await queryClient.refetchQueries({
        queryKey: ["exercises", ""],
        exact: true,
      });

      toast.success("Exercise saved successfully!");
      setName("");
    } catch {
      toast.error("Failed to save exercise. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-padding max-w-md mx-auto">
      <h1 className="text-2xl mb-10 text-center">Add Exercises</h1>
      <div className="flex flex-col gap-5">
        <div>
          <CustomInput
            value={name}
            setValue={setName}
            placeholder="Exercise name"
            label="Exercise Name"
            maxLength={50}
          />
          {name.length >= 50 ? (
            <p className="text-yellow-400 mt-2">
              Reached the limit (50 chars max)
            </p>
          ) : null}
        </div>
        <ExerciseTypeSelect
          value={language}
          onChange={setLanguage}
          options={[
            { value: "en", label: "English" },
            { value: "fi", label: "Finland" },
          ]}
          label="Language"
        />
        <ExerciseTypeSelect
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
        <ExerciseTypeSelect
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
        <ExerciseTypeSelect
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
      </div>
      <div className="mt-20">
        <SaveButton onClick={handleSave} label="Save Exercise" />
      </div>
      {isSaving && <FullScreenLoader message="Saving exercise..." />}
    </div>
  );
}
