"use client";

import CustomInput from "@/app/(app)/ui/CustomInput";
import { useState, useEffect } from "react";
import ExerciseTypeSelect from "@/app/(app)/training/components/ExerciseTypeSelect";
import SaveButton from "@/app/(app)/ui/save-button";
import toast from "react-hot-toast";
import ExerciseDropdownEdit from "@/app/(app)/training/components/ExerciseDropdownEdit";
import DeleteSessionBtn from "@/app/(app)/ui/deleteSessionBtn";
import { gym_exercises } from "../../types/models";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { handleError } from "@/app/(app)/utils/handleError";
import { editExercise, deleteExercise } from "../../database/gym";
import { fetcher } from "../../lib/fetcher";
import { mutate } from "swr";

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
  const [isDeleting, setIsDeleting] = useState(false);

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

      toast.success("Exercise updated successfully!");
      resetFields();
    } catch (error) {
      handleError(error, {
        message: "Error updating exercise",
        route: "/api/gym/edit-exercise",
        method: "POST",
      });
      toast.error("Failed to update exercise. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    setIsDeleting(true);
    setIsSaving(true);

    try {
      await deleteExercise(exerciseId);

      await mutate(
        "/api/gym/user-exercises",
        async () => fetcher("/api/gym/user-exercises"),
        false
      );
      toast.success("Exercise deleted successfully!");
      setSelectedExercise(null);
      setResetTrigger((prev) => prev + 1);
    } catch (error) {
      handleError(error, {
        message: "Error deleting exercise",
        route: "edit-exercise page",
        method: "DELETE",
      });
      toast.error("Failed to delete exercise. Please try again.");
    } finally {
      setIsDeleting(false);
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
    setResetTrigger((prev) => prev + 1);
  };

  return (
    <div className="h-full bg-slate-800 text-gray-100">
      {!selectedExercise && (
        <ExerciseDropdownEdit
          onSelect={(exercise) => {
            setSelectedExercise(exercise);
          }}
          resetTrigger={resetTrigger}
        />
      )}
      <div>
        {selectedExercise && (
          <>
            <div className="flex flex-col p-5 gap-5 max-w-md  mx-auto">
              <h1 className="text-2xl text-center my-5">Edit exercise</h1>
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
                  confirmMessage="Are you sure you want to delete this exercise?"
                />
                <button
                  onClick={() => {
                    resetFields();
                  }}
                  className="mb-10 bg-red-800 py-2 rounded-md shadow-xl border-2 border-red-500 text-gray-100 text-lg cursor-pointer hover:bg-red-700 hover:scale-105 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {isSaving && (
        <FullScreenLoader
          message={isDeleting ? "Deleting exercise..." : "Saving exercise..."}
        />
      )}
    </div>
  );
}
