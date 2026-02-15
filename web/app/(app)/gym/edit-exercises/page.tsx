"use client";

import CustomInput from "@/ui/CustomInput";
import { useState, useEffect } from "react";
import ExerciseTypeSelect from "@/features/gym/components/ExerciseTypeSelect";
import SaveButton from "@/components/buttons/save-button";
import toast from "react-hot-toast";
import ExerciseDropdownEdit from "@/features/gym/components/ExerciseDropdownEdit";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import { gym_exercises } from "@/types/models";
import FullScreenLoader from "@/components/FullScreenLoader";
import { editExercise } from "@/database/gym/edit-exercise";
import { deleteExercise } from "@/database/gym/delete-exercise";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function EditExercises() {
  const { t } = useTranslation("gym");
  const [name, setName] = useState("");
  const [equipment, setEquipment] = useState("");
  const [muscle_group, setMuscleGroup] = useState("");
  const [main_group, setMainGroup] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExercise, setSelectedExercise] =
    useState<gym_exercises | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  const handleUpdateExercise = async () => {
    if (!name || !equipment || !muscle_group || !main_group) {
      toast.error(t("gym.editExerciseScreen.fillAllFields"));
      return;
    }

    if (name.length >= 50) return;
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

      await queryClient.refetchQueries({
        queryKey: ["user-exercises"],
        exact: true,
      });
      toast.success(t("gym.editExerciseScreen.updateSuccess"));
      resetFields();
    } catch {
      toast.error(t("gym.editExerciseScreen.updateError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    setIsDeleting(true);
    setIsSaving(true);

    try {
      await deleteExercise(exerciseId);

      await queryClient.refetchQueries({
        queryKey: ["user-exercises"],
        exact: true,
      });
      toast.success(t("gym.editExerciseScreen.deleteSuccess"));
      setSelectedExercise(null);
    } catch {
      toast.error(t("gym.editExerciseScreen.deleteError"));
    } finally {
      setIsDeleting(false);
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (selectedExercise) {
      setName(selectedExercise.name);
      setEquipment(selectedExercise.equipment);
      setMuscleGroup(selectedExercise.muscle_group);
      setMainGroup(selectedExercise.main_group);
    }
  }, [selectedExercise]);

  const resetFields = () => {
    setName("");
    setEquipment("");
    setMuscleGroup("");
    setMainGroup("");
    setSelectedExercise(null);
  };

  return (
    <div>
      {!selectedExercise && (
        <ExerciseDropdownEdit
          onSelect={(exercise) => {
            setSelectedExercise(exercise);
          }}
        />
      )}
      <div>
        {selectedExercise && (
          <>
            <div className="flex flex-col gap-5 max-w-md mx-auto page-padding">
              <h1 className="text-2xl text-center mb-5">
                {t("gym.editExerciseScreen.title")}
              </h1>
              <div>
                <CustomInput
                  value={name}
                  setValue={setName}
                  placeholder={t("gym.addExerciseScreen.exerciseNamePlaceholder")}
                  label={t("gym.addExerciseScreen.exerciseName")}
                  maxLength={50}
                />
                {name.length >= 50 ? (
                  <p className="text-yellow-400 mt-2">
                    {t("gym.addExerciseScreen.charLimit")}
                  </p>
                ) : null}
              </div>
              <ExerciseTypeSelect
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

              <ExerciseTypeSelect
                value={muscle_group}
                onChange={setMuscleGroup}
                options={[
                  { value: "chest", label: t("gym.muscleGroups.chest") },
                  { value: "quads", label: t("gym.muscleGroups.quads") },
                  { value: "hamstrings", label: t("gym.muscleGroups.hamstrings") },
                  { value: "biceps", label: t("gym.muscleGroups.biceps") },
                  { value: "triceps", label: t("gym.muscleGroups.triceps") },
                  { value: "lats", label: t("gym.muscleGroups.lats") },
                  { value: "abs", label: t("gym.muscleGroups.abs") },
                  { value: "calves", label: t("gym.muscleGroups.calves") },
                  { value: "upper_back", label: t("gym.muscleGroups.upper_back") },
                  { value: "forearms", label: t("gym.muscleGroups.forearms") },
                  { value: "full_body", label: t("gym.muscleGroups.full_body") },
                  { value: "side_delts", label: t("gym.muscleGroups.side_delts") },
                  { value: "legs", label: t("gym.muscleGroups.legs") },
                  { value: "obliques", label: t("gym.muscleGroups.obliques") },
                  { value: "front_delts", label: t("gym.muscleGroups.front_delts") },
                  { value: "traps", label: t("gym.muscleGroups.traps") },
                  { value: "delts", label: t("gym.muscleGroups.delts") },
                  { value: "lower_back", label: t("gym.muscleGroups.lower_back") },
                ]}
                label={t("gym.addExerciseScreen.muscleGroup")}
              />
              <ExerciseTypeSelect
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
              <div className="mt-20 flex flex-col gap-5">
                <div className="flex flex-row gap-5">
                  <DeleteSessionBtn
                    onDelete={() => handleDeleteExercise(selectedExercise.id)}
                    label={t("gym.editExerciseScreen.deleteExercise")}
                    confirmMessage={t("gym.editExerciseScreen.confirmDelete")}
                  />
                  <SaveButton
                    onClick={handleUpdateExercise}
                    label={t("gym.editExerciseScreen.updateExercise")}
                  />
                </div>
                <button
                  onClick={() => {
                    resetFields();
                  }}
                  className="bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500 text-lg cursor-pointer hover:bg-red-700 hover:scale-105 transition-all duration-200"
                >
                  {t("common:common.cancel")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {isSaving && (
        <FullScreenLoader
          message={
            isDeleting
              ? t("gym.editExerciseScreen.deletingExercise")
              : t("gym.editExerciseScreen.savingExercise")
          }
        />
      )}
    </div>
  );
}
