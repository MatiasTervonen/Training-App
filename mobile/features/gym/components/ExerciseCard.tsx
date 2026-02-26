import { Pressable, View } from "react-native";
import AppText from "@/components/AppText";
import {
  ExerciseEntry,
  ExerciseInput,
  LatestHistoryPerExercise,
} from "@/types/session";
import { SquareX } from "lucide-react-native";
import AppInput from "@/components/AppInput";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useConfirmAction } from "@/lib/confirmAction";
import SelectInput from "@/components/Selectinput";
import DropDownModal from "@/components/DropDownModal";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import SubNotesInput from "@/components/SubNotesInput";
import { useTranslation } from "react-i18next";
import AnimatedButton from "@/components/buttons/animatedButton";

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
  disabled?: boolean;
  history?: LatestHistoryPerExercise;
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
  disabled,
  history,
}: ExerciseCardProps) {
  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  const confirmAction = useConfirmAction();

  const { t } = useTranslation("gym");
  return (
    <View className="py-2 px-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <AppText
            className="text-gray-100 text-xl"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {index + 1}. {exercise.name}
          </AppText>
          <View className="flex-row items-center gap-3 mt-1">
            <AppText className="text-gray-400">
              {t(`gym.equipment.${exercise.equipment?.toLowerCase()}`)} /{" "}
              {t(
                `gym.muscleGroups.${exercise.muscle_group?.toLowerCase().replace(/ /g, "_")}`,
              )}
            </AppText>
          </View>
        </View>
        <View className="mr-4">
          <DropDownModal
            disabled={disabled}
            label={`${index + 1}. ${exercise.name}`}
            options={[
              { value: "delete", label: t("gym.exerciseCard.delete") },
              { value: "change", label: t("gym.exerciseCard.change") },
              { value: "history", label: t("gym.exerciseCard.history") },
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
                default:
                  break;
              }
            }}
          />
        </View>
      </View>
      {history?.sets && history?.sets.length > 0 && (
        <View className="flex-row mt-2 flex-wrap">
          <View className="flex-row items-center bg-gray-700/50 px-2 py-0.5 rounded">
            <AppText className="text-sm text-gray-300">
              {t("gym.exerciseCard.last")}{" "}
            </AppText>
            <AppText className="text-sm text-green-400">
              {isCardioExercise(exercise)
                ? history?.sets
                    .map(
                      (set) => `${set.time_min}min / ${set.distance_meters}m`,
                    )
                    .join(" • ")
                : history?.sets
                    .map((set) => `${set.weight}kg × ${set.reps}`)
                    .join(" • ")}
            </AppText>
          </View>
        </View>
      )}
      {mode === "session" && (
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
              {isCardioExercise(exercise) ? (
                <>
                  <View className="flex-1 items-center">
                    <AppText className="p-2 text-lg">
                      {t("gym.exerciseCard.set")}
                    </AppText>
                  </View>
                  <View className="flex-1 items-center">
                    <AppText className="p-2 text-lg">
                      {t("gym.exerciseCard.time")}
                    </AppText>
                  </View>
                  <View className="flex-1 items-center">
                    <AppText className="p-2 text-lg">
                      {t("gym.exerciseCard.length")}
                    </AppText>
                  </View>
                  <View className="w-8" />
                </>
              ) : (
                <>
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
                </>
              )}
            </View>
          </View>

          {exercise.sets.map((set, setIndex) => (
            <View
              key={setIndex}
              className={`border-b border-gray-300 flex-row items-center ${
                set.rpe === "Failure" ? "bg-red-800" : ""
              } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
            >
              {isCardioExercise(exercise) ? (
                <>
                  <View className="flex-1 items-center">
                    <AppText className="p-2 text-lg">{setIndex + 1}</AppText>
                  </View>
                  <View className="flex-1 items-center">
                    <AppText className="p-2 text-lg">{set.time_min}</AppText>
                  </View>
                  <View className="flex-1 items-center">
                    <AppText className="p-2 text-lg">
                      {set.distance_meters}
                    </AppText>
                  </View>
                </>
              ) : (
                <>
                  <View className="flex-1 items-center">
                    <AppText className="p-2 text-lg">{setIndex + 1}</AppText>
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
                </>
              )}
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
            {isCardioExercise(exercise) ? (
              <>
                <View className="flex-row items-center justify-center gap-2 px-2">
                  <View className="w-2/4">
                    <AppInput
                      placeholder={t("gym.exerciseCard.timePlaceholder")}
                      keyboardType="numeric"
                      value={input.time_min ?? ""}
                      onChangeText={(val) => {
                        const numbersOnly = val.replace(/[^0-9.]/g, "");
                        onInputChange(index, "time_min", numbersOnly);
                      }}
                    />
                  </View>
                  <View className="w-2/4">
                    <AppInput
                      placeholder={t("gym.exerciseCard.lengthPlaceholder")}
                      keyboardType="numeric"
                      value={input.distance_meters ?? ""}
                      onChangeText={(val) => {
                        const numbersOnly = val.replace(/[^0-9.]/g, "");
                        onInputChange(index, "distance_meters", numbersOnly);
                      }}
                    />
                  </View>
                </View>
              </>
            ) : (
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
            )}
          </View>

          <AnimatedButton
            onPress={() => {
              if (isCardioExercise(exercise)) {
                const isTimeEmpty =
                  !input.time_min || input.time_min.trim() === "";

                if (isTimeEmpty) {
                  Toast.show({
                    type: "error",
                    text1: t("gym.exerciseCard.missingData"),
                    text2: t("gym.exerciseCard.fillTime"),
                  });
                  return;
                }
              } else {
                const isRepsEmpty = !input.reps || input.reps.trim() === "";

                if (isRepsEmpty) {
                  Toast.show({
                    type: "error",
                    text1: t("gym.exerciseCard.missingData"),
                    text2: t("gym.exerciseCard.fillReps"),
                  });
                  return;
                }
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
