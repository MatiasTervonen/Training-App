"use client";

import DropdownMenu from "@/components/dropdownMenu";
import { Menu, SquareX } from "lucide-react";
import SetInput from "@/features/gym/components/SetInput";
import ExerciseTypeSelect from "@/features/gym/components/ExerciseTypeSelect";
import { useUserStore } from "@/lib/stores/useUserStore";
import { ExerciseEntry, ExerciseInput } from "@/types/session";
import toast from "react-hot-toast";
import SubNotesInput from "@/ui/SubNotesInput";
import { useTranslation } from "react-i18next";

type ExerciseCardProps = {
  index: number;
  exercise: ExerciseEntry;
  input: ExerciseInput;
  onUpdateExercise: (index: number, updated: ExerciseEntry) => void;
  onDeleteExercise: (index: number) => void;
  lastExerciseHistory: (index: number) => void;
  onInputChange: (
    index: number,
    field: "weight" | "reps" | "rpe" | "time_min" | "distance_meters",
    value: number | string,
  ) => void;
  onAddSet: (index: number) => void;
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
  onChangeExercise: (index: number) => void;
  mode?: "session";
};

const isCardioExercise = (exercise: ExerciseEntry) => {
  return exercise.main_group?.toLowerCase() === "cardio";
};

export default function ExerciseCard({
  index,
  exercise,
  input,
  onUpdateExercise,
  onDeleteExercise,
  onInputChange,
  onAddSet,
  onDeleteSet,
  lastExerciseHistory,
  onChangeExercise,
  mode,
}: ExerciseCardProps) {
  const { t } = useTranslation("gym");

  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  return (
    <div className="py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-gray-100 text-lg">
            {index + 1}. {exercise.name}
          </span>
          <span className="text-sm text-gray-400">
            {t(`gym.equipment.${exercise.equipment?.toLowerCase()}`)} /{" "}
            {t(
              `gym.muscleGroups.${exercise.muscle_group?.toLowerCase().replace(/ /g, "_")}`,
            )}
          </span>
        </div>

        <DropdownMenu
          button={<Menu />}
          onDelete={() => onDeleteExercise(index)}
          onHistory={() => lastExerciseHistory(index)}
          onChange={() => onChangeExercise(index)}
        />
      </div>

      {mode === "session" && (
        <>
          <div className="my-4 ">
            <SubNotesInput
              label={t("gym.exerciseCard.notesFor")}
              notes={exercise.notes || ""}
              setNotes={(newNotes) => {
                onUpdateExercise(index, { ...exercise, notes: newNotes });
              }}
              placeholder={t("gym.exerciseCard.notesPlaceholder")}
            />
          </div>

          <table className="w-full text-left text-gray-100">
            <thead>
              <tr className="text-gray-300 border-b">
                <th className="p-2 font-normal">
                  {t("gym.exerciseCard.set")}{" "}
                </th>
                {isCardioExercise(exercise) ? (
                  <>
                    <th className="p-2 font-normal">
                      {t("gym.exerciseCard.timePlaceholder")}
                    </th>
                    <th className="p-2 font-normal">
                      {t("gym.exerciseCard.lengthPlaceholder")}
                    </th>
                  </>
                ) : (
                  <>
                    <th className="p-2 font-normal">
                      {t("gym.exerciseCard.weight")}
                    </th>
                    <th className="p-2 font-normal">
                      {t("gym.exerciseCard.reps")}
                    </th>
                    <th className="p-2 font-normal">
                      {t("gym.exerciseCard.rpe")}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {exercise.sets.map((set, i) => (
                <tr
                  key={i}
                  className={`border-b ${
                    set.rpe === "Failure" ? "bg-red-800" : ""
                  } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                >
                  {isCardioExercise(exercise) ? (
                    <>
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{set.time_min}</td>
                      <td className="p-2">{set.distance_meters}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">
                        {set.weight} {weightUnit}
                      </td>
                      <td className="p-2">{set.reps}</td>
                      <td className="p-2">{set.rpe}</td>
                    </>
                  )}

                  <td>
                    <button
                      className="bg-red-600 p-1 rounded text-gray-100 "
                      onClick={() => {
                        const confirmed = window.confirm(
                          "Are you sure you want to delete this set?",
                        );
                        if (!confirmed) return;
                        onDeleteSet(index, i);
                      }}
                    >
                      <SquareX />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-center gap-4 mt-6">
            {isCardioExercise(exercise) ? (
              <>
                <div className="flex items-center gap-2 w-2/4">
                  <SetInput
                    placeholder="Time in min..."
                    type="number"
                    value={input.time_min ?? ""}
                    onChange={(e) =>
                      onInputChange(index, "time_min", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center gap-5 w-2/4">
                  <SetInput
                    placeholder="Length (meters)"
                    type="number"
                    value={input.distance_meters ?? ""}
                    onChange={(e) =>
                      onInputChange(index, "distance_meters", e.target.value)
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 w-2/3">
                  <SetInput
                    placeholder="Weight..."
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={input.weight ?? ""}
                    onChange={(e) => {
                      onInputChange(index, "weight", e.target.value);
                    }}
                  />
                  <SetInput
                    placeholder="Reps..."
                    type="text"
                    inputMode="numeric"
                    value={input.reps ?? ""}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) {
                        onInputChange(index, "reps", e.target.value);
                      }
                    }}
                  />
                </div>
                <div className="w-1/3">
                  <ExerciseTypeSelect
                    value={input.rpe!}
                    onChange={(val) => onInputChange(index, "rpe", val)}
                    options={[
                      {
                        value: "Warm-up",
                        label: t("gym.exerciseCard.rpeOptions.warmup"),
                      },
                      {
                        value: "Easy",
                        label: t("gym.exerciseCard.rpeOptions.easy"),
                      },
                      {
                        value: "Medium",
                        label: t("gym.exerciseCard.rpeOptions.medium"),
                      },
                      {
                        value: "Hard",
                        label: t("gym.exerciseCard.rpeOptions.hard"),
                      },
                      {
                        value: "Failure",
                        label: t("gym.exerciseCard.rpeOptions.failure"),
                      },
                    ]}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 my-6">
            <button
              onClick={() => {
                if (isCardioExercise(exercise)) {
                  const isTimeEmpty =
                    !input.time_min || input.time_min.trim() === "";

                  if (isTimeEmpty) {
                    toast.error(
                      `${t("gym.exerciseCard.missingData")}, ${t("gym.exerciseCard.fillTime")}`,
                    );
                    return;
                  }
                } else {
                  const isRepsEmpty = !input.reps || input.reps.trim() === "";

                  if (isRepsEmpty) {
                    toast.error(
                      `${t("gym.exerciseCard.missingData")}, ${t("gym.exerciseCard.fillReps")}`,
                    );
                    return;
                  }
                }

                onAddSet(index);
              }}
              className="px-10 bg-blue-900 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200"
            >
              {t("gym.exerciseCard.addSet")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
