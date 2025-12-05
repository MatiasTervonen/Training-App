"use client";

import CustomInput from "@/app/(app)/ui/CustomInput";
import { useState, useEffect } from "react";
import ExerciseTypeSelect from "@/app/(app)/training/components/ExerciseTypeSelect";
import SaveButton from "@/app/(app)/ui/save-button";
import toast from "react-hot-toast";
import ExerciseDropdown from "@/app/(app)/training/components/ExerciseDropdown";
import DeleteSessionBtn from "@/app/(app)/ui/deleteSessionBtn";
import { gym_exercises } from "../../types/models";
import FullScreenLoader from "../../components/FullScreenLoader";
import { deleteExercise, editExercise } from "../../database/gym";
import { useQueryClient } from "@tanstack/react-query";

export default function EditExercises() {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");
  const [equipment, setEquipment] = useState("");
  const [muscle_group, setMuscleGroup] = useState("");
  const [main_group, setMainGroup] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExercise, setSelectedExercise] =
    useState<gym_exercises | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  const queryClient = useQueryClient();

  const handleUpdateExercise = async () => {
    if (!name || !equipment || !muscle_group || !main_group) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (name.length >= 50) return;

    setIsSaving(true);

    const exerciseData = {
      id: selectedExercise!.id,
      name,
      language,
      equipment,
      muscle_group,
      main_group,
    };

    try {
      await editExercise(exerciseData);

      queryClient.refetchQueries({
        queryKey: ["exercises", ""],
        exact: true,
      });

      toast.success("Exercise updated successfully!");
      resetFields();
    } catch {
      toast.error("Failed to update exercise. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    setIsSaving(true);

    try {
      await deleteExercise(exerciseId);

      await queryClient.refetchQueries({
        queryKey: ["exercises", ""],
        exact: true,
      });

      toast.success("Exercise deleted successfully!");
      setSelectedExercise(null);
      setResetTrigger((prev) => prev + 1);
    } catch {
      toast.error("Failed to delete exercise. Please try again.");
    } finally {
      setIsSaving(false);
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

  return (
    <div>
      {!selectedExercise && (
        <ExerciseDropdown
          onSelect={(exercise) => {
            setSelectedExercise(exercise);
          }}
          resetTrigger={resetTrigger}
        />
      )}
      <div>
        {selectedExercise && (
          <>
            <div className="flex flex-col page-padding gap-5 max-w-md mx-auto">
              <h1 className="text-2xl text-center mb-10">Edit exercise</h1>
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
              <ExerciseTypeSelect
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
              <div className="mt-20 flex flex-col gap-5">
                <SaveButton
                  onClick={handleUpdateExercise}
                  label="Update Exercise"
                />
                <DeleteSessionBtn
                  onDelete={() => handleDeleteExercise(selectedExercise.id)}
                  label="Delete Exercise"
                />
                <button
                  onClick={() => {
                    resetFields();
                  }}
                  className="bg-red-800 py-2 rounded-md shadow-xl border-2 border-red-500 text-gray-100 text-lg cursor-pointer hover:bg-red-700 hover:scale-105 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {isSaving && <FullScreenLoader message="Saving exercise..." />}
    </div>
  );
}
