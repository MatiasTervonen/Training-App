"use client";

import CustomInput from "@/app/(app)/ui/CustomInput";
import { useState } from "react";
import ExerciseTypeSelect from "@/app/(app)/gym/components/ExerciseTypeSelect";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import toast from "react-hot-toast";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { handleError } from "@/app/(app)/utils/handleError";
import { addExercise } from "@/app/(app)/database/gym/add-exercise";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function AddExercise() {
  const { t } = useTranslation("gym");
  const [name, setName] = useState("");
  const [equipment, setEquipment] = useState("barbell");
  const [muscleGroup, setMuscleGroup] = useState("chest");
  const [mainGroup, setMainGroup] = useState("chest");
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (name.length >= 50) return;

    if (!name) {
      toast.error(t("gym.addExerciseScreen.nameRequired"));
      return;
    }
    setIsSaving(true);

    const exerciseData = {
      name,
      equipment,
      muscle_group: muscleGroup,
      main_group: mainGroup,
    };

    try {
      await addExercise(exerciseData);

      await queryClient.refetchQueries({
        queryKey: ["user-exercises"],
        exact: true,
      });
      toast.success(t("gym.addExerciseScreen.saveSuccess"));
      setName("");
    } catch (error) {
      handleError(error, {
        message: "Error saving exercise",
        route: "/api/gym/add-exercise",
        method: "POST",
      });
      toast.error(t("gym.addExerciseScreen.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-padding max-w-md mx-auto">
      <h1 className="text-2xl mb-10 text-center">
        {t("gym.addExerciseScreen.title")}
      </h1>
      <div className="flex flex-col gap-5">
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
          value={muscleGroup}
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
          ]}
          label={t("gym.addExerciseScreen.muscleGroup")}
        />
        <ExerciseTypeSelect
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
      </div>
      <div className="mt-20">
        <SaveButton
          onClick={handleSave}
          label={t("gym.addExerciseScreen.saveExercise")}
        />
      </div>
      {isSaving && (
        <FullScreenLoader message={t("gym.addExerciseScreen.savingExercise")} />
      )}
    </div>
  );
}
