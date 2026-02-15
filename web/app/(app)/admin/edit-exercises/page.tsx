"use client";

import CustomInput from "@/ui/CustomInput";
import { useState, useEffect } from "react";
import ExerciseTypeSelect from "@/features/gym/components/ExerciseTypeSelect";
import SaveButton from "@/components/buttons/save-button";
import toast from "react-hot-toast";
import ExerciseDropdown from "@/features/gym/components/ExerciseDropdown";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import FullScreenLoader from "@/components/FullScreenLoader";
import { deleteExercise } from "@/database/admin/delete-exercise";
import { editExercise } from "@/database/admin/edit-exercise";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ExerciseForEdit } from "@/database/admin/get-fullExercise";
import { getFullExercise } from "@/database/admin/get-fullExercise";
import { useUserStore } from "@/lib/stores/useUserStore";

export default function EditExercises() {
  const { t } = useTranslation("gym");
  const [name, setName] = useState("");
  const [fiName, setFiName] = useState("");
  const [equipment, setEquipment] = useState("");
  const [muscle_group, setMuscleGroup] = useState("");
  const [main_group, setMainGroup] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseForEdit | null>(null);

  const language = useUserStore((state) => state.preferences?.language ?? "en");

  const queryClient = useQueryClient();

  const handleUpdateExercise = async () => {
    if (!name || !equipment || !muscle_group || !main_group) {
      toast.error(t("gym.editExerciseScreen.fillAllFields"));
      return;
    }

    if (name.length >= 50 || fiName.length >= 50) return;

    setIsSaving(true);

    const exerciseData = {
      id: selectedExercise!.id,
      name,
      fiName,
      equipment,
      muscle_group,
      main_group,
    };

    try {
      await editExercise(exerciseData);

      queryClient.refetchQueries({
        queryKey: ["exercises", language],
        exact: true,
      });
      queryClient.refetchQueries({
        queryKey: ["recentExercises", language],
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
    setIsSaving(true);

    try {
      await deleteExercise(exerciseId);

      await queryClient.refetchQueries({
        queryKey: ["exercises", ""],
        exact: true,
      });

      toast.success(t("gym.editExerciseScreen.deleteSuccess"));
      setSelectedExercise(null);
    } catch {
      toast.error(t("gym.editExerciseScreen.deleteError"));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (selectedExercise) {
      setName(selectedExercise.name);
      setFiName(selectedExercise.fiName);
      setEquipment(selectedExercise.equipment);
      setMuscleGroup(selectedExercise.muscle_group);
      setMainGroup(selectedExercise.main_group);
    }
  }, [selectedExercise]);

  const resetFields = () => {
    setName("");
    setFiName("");
    setEquipment("");
    setMuscleGroup("");
    setMainGroup("");
    setSelectedExercise(null);
  };

  return (
    <div>
      {!selectedExercise && (
        <ExerciseDropdown
          onSelect={async (exercise) => {
            const fullExercise = await getFullExercise(exercise.id);
            setSelectedExercise(fullExercise);
          }}
        />
      )}
      <div>
        {selectedExercise && (
          <>
            <div className="flex flex-col page-padding gap-5 max-w-md mx-auto">
              <h1 className="text-2xl text-center mb-10">
                {t("gym.editExerciseScreen.title")}
              </h1>
              <div>
                <CustomInput
                  value={name}
                  setValue={setName}
                  placeholder={t(
                    "gym.addExerciseScreen.exerciseNamePlaceholder",
                  )}
                  label={t("gym.addExerciseScreen.exerciseName")}
                  maxLength={50}
                />
                {name.length >= 50 ? (
                  <p className="text-yellow-400 mt-2">
                    {t("gym.addExerciseScreen.charLimit")}
                  </p>
                ) : null}
              </div>
              <div>
                <CustomInput
                  value={fiName}
                  setValue={setFiName}
                  placeholder={t(
                    "gym.addExerciseScreen.exerciseNamePlaceholder",
                  )}
                  label={t("gym.addExerciseScreen.fiExerciseName")}
                  maxLength={50}
                />
                {fiName.length >= 50 ? (
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
                  {
                    value: "full_body",
                    label: t("gym.muscleGroups.full_body"),
                  },
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
                  className="bg-red-800 py-2 rounded-md shadow-xl border-2 border-red-500 text-gray-100 text-lg cursor-pointer hover:bg-red-700 hover:scale-105 transition-all duration-200"
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
          message={t("gym.editExerciseScreen.savingExercise")}
        />
      )}
    </div>
  );
}
