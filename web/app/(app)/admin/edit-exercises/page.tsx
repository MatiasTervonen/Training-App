"use client";

import ModalPageWrapper from "@/app/(app)/components/modalPageWrapper";
import TitleInput from "@/app/(app)/training/components/TitleInput";
import { useState, useEffect } from "react";
import ExerciseTypeSelect from "@/app/(app)/training/components/ExerciseTypeSelect";
import SaveButton from "@/app/(app)/ui/save-button";
import toast from "react-hot-toast";
import ExerciseDropdown from "@/app/(app)/training/components/ExerciseDropdown";
import DeleteSessionBtn from "@/app/(app)/ui/deleteSessionBtn";
import { gym_exercises } from "../../types/models";
import FullScreenLoader from "../../components/FullScreenLoader";

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

  const handleUpdateExercise = async () => {
    if (!name || !equipment || !muscle_group || !main_group) {
      toast.error("Please fill in all fields.");
      return;
    }
    setIsSaving(true);

    const exerciseData = {
      id: selectedExercise?.id,
      name,
      language,
      equipment,
      muscle_group,
      main_group,
    };

    try {
      const response = await fetch("/api/gym/edit-exercise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exerciseData),
      });

      if (!response.ok) {
        throw new Error("Failed to save exercise");
      }

      await response.json();

      toast.success("Exercise updated successfully!");
      resetFields();
    } catch (error) {
      console.error("Error update exercise:", error);
      toast.error("Failed to update exercise. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      const response = await fetch("/api/gym/delete-exercise", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item_id: exerciseId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete exercise");
      }

      await response.json();
      toast.success("Exercise deleted successfully!");
      setSelectedExercise(null);
      setResetTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast.error("Failed to delete exercise. Please try again.");
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
    <ModalPageWrapper>
      <div className="h-full bg-slate-800 text-gray-100">
        <h1 className="text-2xl pt-10 text-center">edit/delete Exercises</h1>
        <div>
          {!selectedExercise && (
            <ExerciseDropdown
              onSelect={(exercise) => {
                setSelectedExercise(exercise);
              }}
              resetTrigger={resetTrigger}
            />
          )}

          {selectedExercise && (
            <>
              <div className="flex flex-col px-4 gap-5 mt-10 max-w-md mx-auto">
                <TitleInput
                  title={name}
                  setTitle={setName}
                  placeholder="Exercise name"
                  label="Exercise Name"
                />
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
                    className="mb-10 bg-red-800 py-2 rounded-md shadow-xl border-2 border-red-500 text-gray-100 text-lg cursor-pointer hover:bg-red-700 hover:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving exercise..." />}
    </ModalPageWrapper>
  );
}
