import { Pressable, View } from "react-native";
import { useState, useMemo } from "react";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import {
  ExerciseEntry,
  ExerciseInput,
  LatestHistoryPerExercise,
} from "@/types/session";
import { SquareX, ChevronDown, ChevronUp, Timer } from "lucide-react-native";
import AppInput from "@/components/AppInput";
import { useUserStore } from "@/lib/stores/useUserStore";

import { useConfirmAction } from "@/lib/confirmAction";
import SelectInput from "@/components/Selectinput";
import DropDownModal from "@/components/DropDownModal";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import SubNotesInput from "@/components/SubNotesInput";
import { useTranslation } from "react-i18next";
import AnimatedButton from "@/components/buttons/animatedButton";
import BodyTextNC from "@/components/BodyTextNC";

type ExerciseCardProps = {
  index: number;
  exercise: ExerciseEntry;
  input: ExerciseInput;
  onUpdateExercise: (index: number, updated: ExerciseEntry) => void;
  onDeleteExercise: (index: number) => void;
  lastExerciseHistory: (index: number) => void;
  onInputChange: (
    index: number,
    field: "weight" | "reps" | "rpe",
    value: number | string,
  ) => void;
  onAddSet: (index: number) => void;
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
  onChangeExercise: (index: number) => void;
  mode?: "session";
  disabled?: boolean;
  history?: LatestHistoryPerExercise;
  bestE1rm?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
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
  disabled,
  history,
  bestE1rm,
  isExpanded,
  onToggleExpand,
}: ExerciseCardProps) {
  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  const confirmAction = useConfirmAction();

  const { t } = useTranslation("gym");
  const showContent = isExpanded !== false;
  const [showRestTimerInput, setShowRestTimerInput] = useState(false);

  const pbSetIndices = useMemo(() => {
    if (bestE1rm == null || !exercise.sets.length) return new Set<number>();
    const indices = new Set<number>();
    let runningBest = bestE1rm;
    for (let i = 0; i < exercise.sets.length; i++) {
      const s = exercise.sets[i];
      const w = s.weight || 0;
      const r = s.reps || 0;
      if (w === 0) continue;
      const e1rm = r <= 1 ? w : w * (1 + r / 30);
      if (e1rm > runningBest) {
        runningBest = e1rm;
        indices.add(i);
      }
    }
    return indices;
  }, [exercise.sets.length, bestE1rm]);

  return (
    <View className="py-2 px-4">
      <View className="flex-row  justify-between">
        <Pressable
          onPress={onToggleExpand}
          disabled={!onToggleExpand}
          className="flex-1 mr-2"
        >
          <AppText
            className="text-lg"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {index + 1}. {exercise.name}
          </AppText>
          <View className="flex-row items-center justify-between mt-1">
            <BodyTextNC className="text-gray-400 shrink" numberOfLines={1}>
              {t(`gym.equipment.${exercise.equipment?.toLowerCase()}`)} /{" "}
              {t(
                `gym.muscleGroups.${exercise.muscle_group?.toLowerCase().replace(/ /g, "_")}`,
              )}
            </BodyTextNC>
            {mode === "session" && !showContent && exercise.sets.length > 0 && (
              <View className="bg-gray-600 px-2 py-0.5 rounded ml-2">
                <BodyTextNC className="text-sm text-gray-300">
                  {exercise.sets.length} {t("gym.exerciseCard.setsLabel")}
                </BodyTextNC>
              </View>
            )}
          </View>
        </Pressable>
        <DropDownModal
          disabled={disabled}
          label={`${index + 1}. ${exercise.name}`}
          options={[
            { value: "delete", label: t("gym.exerciseCard.delete") },
            { value: "change", label: t("gym.exerciseCard.change") },
            { value: "history", label: t("gym.exerciseCard.history") },
            ...(mode !== "session"
              ? [{ value: "restTimer", label: t("gym.exerciseCard.restTimer") }]
              : []),
          ]}
          onChange={(value) => {
            switch (value) {
              case "delete":
                onDeleteExercise(index);
                break;
              case "change":
                onChangeExercise(index);
                break;
              case "history":
                lastExerciseHistory(index);
                break;
              case "restTimer":
                setShowRestTimerInput((prev) => !prev);
                break;
              default:
                break;
            }
          }}
        />
      </View>
      <View className="flex-row items-center justify-between mt-2">
        {history?.sets && history?.sets.length > 0 ? (
          <View className="flex-row items-center bg-gray-700/50 px-2 py-0.5 rounded shrink">
            <BodyTextNC className="text-sm text-gray-300 shrink-0">
              {t("gym.exerciseCard.last")}{" "}
            </BodyTextNC>
            <BodyTextNC
              className="text-sm text-green-400 shrink"
              numberOfLines={1}
            >
              {history?.sets
                .map((set) => `${set.weight}kg × ${set.reps}`)
                .join(" • ")}
            </BodyTextNC>
          </View>
        ) : (
          <View />
        )}
        {onToggleExpand && (
          <Pressable onPress={onToggleExpand} hitSlop={10} className="pl-2">
            {showContent ? (
              <ChevronUp color="#9ca3af" size={24} />
            ) : (
              <ChevronDown color="#9ca3af" size={24} />
            )}
          </Pressable>
        )}
      </View>
      {exercise.rest_timer_seconds != null && !showRestTimerInput && (
        <View className="flex-row items-center mt-2">
          <Timer size={14} color="#60a5fa" />
          <BodyTextNC className="text-sm text-blue-400 ml-1">
            {exercise.rest_timer_seconds}s
          </BodyTextNC>
        </View>
      )}
      {showRestTimerInput && mode !== "session" && (
        <View className="mt-3 mb-1">
          <AppInput
            value={
              exercise.rest_timer_seconds != null
                ? String(exercise.rest_timer_seconds)
                : ""
            }
            onChangeText={(val) => {
              if (val === "") {
                onUpdateExercise(index, {
                  ...exercise,
                  rest_timer_seconds: null,
                });
              } else if (/^\d+$/.test(val)) {
                onUpdateExercise(index, {
                  ...exercise,
                  rest_timer_seconds: Number(val),
                });
              }
            }}
            placeholder={t("gym.exerciseCard.restTimerPlaceholder")}
            label={t("gym.exerciseCard.restTimerLabel")}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      )}
      {mode === "session" && showContent && (
        <>
          <View className="my-4">
            <SubNotesInput
              label={t("gym.exerciseCard.notesFor")}
              placeholder={t("gym.exerciseCard.notesPlaceholder")}
              value={exercise.notes || ""}
              setValue={(newNotes) =>
                onUpdateExercise(index, { ...exercise, notes: newNotes })
              }
            />
          </View>

          <View className="w-full">
            <View className="text-gray-300 border-b border-gray-300 flex-row">
              <View className="flex-1 items-center">
                <AppText className="p-2 text-lg">
                  {t("gym.exerciseCard.set")}
                </AppText>
              </View>
              <View className="flex-1 items-center">
                <AppText className="p-2 text-lg">
                  {t("gym.exerciseCard.weight")}
                </AppText>
              </View>
              <View className="flex-1 items-center">
                <AppText className="p-2 text-lg">
                  {t("gym.exerciseCard.reps")}
                </AppText>
              </View>
              <View className="flex-1 items-center">
                <AppText className="p-2 text-lg">
                  {t("gym.exerciseCard.rpe")}
                </AppText>
              </View>
              <View className="w-8" />
            </View>
          </View>

          {exercise.sets.map((set, setIndex) => (
            <View
              key={setIndex}
              className={`border-b border-gray-300 flex-row items-center ${
                pbSetIndices.has(setIndex)
                  ? "bg-yellow-500/15"
                  : set.rpe === "Failure"
                    ? "bg-red-500/15"
                    : set.rpe === "Warm-up"
                      ? "bg-blue-500/15"
                      : ""
              }`}
            >
              <View className="flex-1 items-center flex-row justify-center">
                {pbSetIndices.has(setIndex) ? (
                  <AppTextNC className="p-2 text-sm text-yellow-400">
                    PB
                  </AppTextNC>
                ) : (
                  <AppText className="p-2 text-lg">{setIndex + 1}</AppText>
                )}
              </View>
              <View className="flex-1 items-center">
                <AppText className="p-2 text-lg">
                  {set.weight} {weightUnit}
                </AppText>
              </View>
              <View className="flex-1 items-center">
                <AppText className="p-2 text-lg">{set.reps}</AppText>
              </View>
              <View className="flex-1 items-center">
                <AppText className="p-2 text-lg">
                  {set.rpe
                    ? (
                        {
                          "Warm-up": "1",
                          Easy: "2",
                          Medium: "3",
                          Hard: "4",
                          Failure: "5",
                        } as Record<string, string>
                      )[set.rpe] || set.rpe
                    : ""}
                </AppText>
              </View>
              <View className="w-8 items-center">
                <Pressable
                  onPress={async () => {
                    const confirmed = await confirmAction({
                      title: t("gym.exerciseCard.deleteSetTitle"),
                      message: t("gym.exerciseCard.deleteSetMessage"),
                    });
                    if (!confirmed) return;

                    onDeleteSet(index, setIndex);
                  }}
                >
                  <SquareX color="#dc2626" />
                </Pressable>
              </View>
            </View>
          ))}

          <View className="flex-row items-center justify-center gap-4 mt-6">
            <View className="flex-row gap-2 items-center justify-center px-2">
              <View className="w-1/3">
                <AppInput
                  placeholder={t("gym.exerciseCard.weightPlaceholder")}
                  keyboardType="numeric"
                  maxLength={5}
                  value={input.weight ?? ""}
                  onChangeText={(val) => {
                    const numbersOnly = val.replace(/[^0-9.,]/g, "");
                    onInputChange(index, "weight", numbersOnly);
                  }}
                />
              </View>
              <View className="w-1/3">
                <AppInput
                  placeholder={t("gym.exerciseCard.repsPlaceholder")}
                  keyboardType="numeric"
                  maxLength={5}
                  value={input.reps || ""}
                  onChangeText={(val) => {
                    if (/^\d*$/.test(val)) {
                      onInputChange(index, "reps", val);
                    }
                  }}
                />
              </View>
              <View className="w-1/3">
                <SelectInput
                  disabled={disabled}
                  label={`${index + 1}. ${exercise.name}`}
                  value={input.rpe}
                  selectedDisplay={
                    input.rpe
                      ? (
                          {
                            "Warm-up": "1",
                            Easy: "2",
                            Medium: "3",
                            Hard: "4",
                            Failure: "5",
                          } as Record<string, string>
                        )[input.rpe]
                      : undefined
                  }
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
              </View>
            </View>
          </View>

          <AnimatedButton
            onPress={() => {
              const isRepsEmpty = !input.reps || input.reps.trim() === "";

              if (isRepsEmpty) {
                Toast.show({
                  type: "error",
                  text1: t("gym.exerciseCard.missingData"),
                  text2: t("gym.exerciseCard.fillReps"),
                });
                return;
              }

              onAddSet(index);
            }}
            label={t("gym.exerciseCard.addSet")}
            className="btn-base my-4 w-1/2 self-center"
          />
        </>
      )}
    </View>
  );
}
