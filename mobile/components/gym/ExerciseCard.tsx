import { Pressable, View } from "react-native";
import AppText from "@/components/AppText";
import { ExerciseEntry, ExerciseInput } from "@/types/session";
import { SquareX } from "lucide-react-native";
import AppInput from "../AppInput";
import { useUserStore } from "@/lib/stores/useUserStore";
import { confirmAction } from "@/lib/confirmAction";
import SelectInput from "../Selectinput";
import AppButton from "@/components/buttons/AppButton";
import DropDownModal from "../DropDownModal";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import SubNotesInput from "../SubNotesInput";

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
    value: number | string
  ) => void;
  onAddSet: (index: number) => void;
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
  onChangeExercise: (index: number) => void;
  mode?: "session";
  disabled?: boolean;
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
}: ExerciseCardProps) {
  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

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
          <AppText className="text-lg text-gray-400 mt-1">
            {exercise.equipment} / {exercise.muscle_group}
          </AppText>
        </View>
        <View className="mr-4">
          <DropDownModal
            disabled={disabled}
            label={`${index + 1}. ${exercise.name}`}
            options={[
              { value: "delete", label: "Delete" },
              { value: "change", label: "Change" },
              { value: "history", label: "History" },
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
      {mode === "session" && (
        <>
          <View className="my-4">
            <SubNotesInput
              label={`Notes for ${exercise.name}`}
              className="min-h-[60px]"
              placeholder="Add your notes here..."
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
                  <View className="w-[20%]">
                    <AppText className="p-2 text-lg">Set</AppText>
                  </View>
                  <View className="w-[30%]">
                    <AppText className="p-2 text-lg">Time</AppText>
                  </View>
                  <View className="w-[30%]">
                    <AppText className="p-2 text-lg">Length</AppText>
                  </View>
                  <View className="w-[20%]">
                    <AppText className="p-2 text-lg"></AppText>
                  </View>
                </>
              ) : (
                <>
                  <View className="w-[17%] text-center">
                    <AppText className="p-2 text-lg">Set</AppText>
                  </View>
                  <View className="w-[28%] text-center">
                    <AppText className="p-2 text-lg">Weight</AppText>
                  </View>
                  <View className="w-[20%] text-center">
                    <AppText className="p-2 text-lg">Reps</AppText>
                  </View>
                  <View className="w-[30%] text-center">
                    <AppText className="p-2 text-lg">RPE</AppText>
                  </View>
                  <View className="w-[5%] text-center">
                    <AppText className="p-2 text-lg"></AppText>
                  </View>
                </>
              )}
            </View>
          </View>

          {exercise.sets.map((set, setIndex) => (
            <View
              key={setIndex}
              className={`border-b border-gray-300 flex-row  items-center  ${
                set.rpe === "Failure" ? "bg-red-800" : ""
              } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
            >
              {isCardioExercise(exercise) ? (
                <>
                  <View className="w-[20%] text-center">
                    <AppText className="p-2 text-lg ">{setIndex + 1}</AppText>
                  </View>
                  <View className="w-[30%] text-center">
                    <AppText className="p-2 text-lg ">{set.time_min}</AppText>
                  </View>
                  <View className="w-[30%] text-center">
                    <AppText className="p-2 text-lg">
                      {set.distance_meters}
                    </AppText>
                  </View>
                </>
              ) : (
                <>
                  <View className="w-[17%] text-center">
                    <AppText className="p-2 text-lg">{setIndex + 1}</AppText>
                  </View>
                  <View className="w-[28%] text-center">
                    <AppText className="p-2 text-lg">
                      {set.weight} {weightUnit}
                    </AppText>
                  </View>
                  <View className="w-[20%] text-center">
                    <AppText className="p-2 text-lg">{set.reps}</AppText>
                  </View>
                  <View className="w-[30%] text-center">
                    <AppText className="p-2 text-lg">{set.rpe}</AppText>
                  </View>
                </>
              )}
              <View className="w-[5%] items-end">
                <Pressable
                  onPress={async () => {
                    const confirmed = await confirmAction({
                      title: "Delete Set",
                      message: "Are you sure you want to delete this set?",
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
                      placeholder="Time (min)"
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
                      placeholder="Length (meters)"
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
                    placeholder="Weight..."
                    keyboardType="numeric"
                    value={input.weight ?? ""}
                    onChangeText={(val) => {
                      const numbersOnly = val.replace(/[^0-9.]/g, "");
                      onInputChange(index, "weight", numbersOnly);
                    }}
                  />
                </View>
                <View className="w-1/3">
                  <AppInput
                    placeholder="Reps..."
                    keyboardType="numeric"
                    value={input.reps || ""}
                    onChangeText={(val) => {
                      const numbersOnly = val.replace(/[^0-9.]/g, "");
                      onInputChange(index, "reps", numbersOnly);
                    }}
                  />
                </View>
                <View className="w-1/3">
                  <SelectInput
                    disabled={disabled}
                    label={`${index + 1}. ${exercise.name}`}
                    value={input.rpe}
                    onChange={(val) => onInputChange(index, "rpe", val)}
                    options={[
                      { value: "Warm-up", label: "Warm-up" },
                      { value: "Easy", label: "Easy" },
                      { value: "Medium", label: "Medium" },
                      { value: "Hard", label: "Hard" },
                      { value: "Failure", label: "Failure" },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
          <View className="mx-auto mt-2">
            <AppButton
              onPress={() => {
                if (isCardioExercise(exercise)) {
                  const isTimeEmpty =
                    !input.time_min || input.time_min.trim() === "";

                  if (isTimeEmpty) {
                    Toast.show({
                      type: "error",
                      text1: "Missing data",
                      text2: "Please fill time (min).",
                    });
                    return;
                  }
                } else {
                  const isRepsEmpty = !input.reps || input.reps.trim() === "";

                  if (isRepsEmpty) {
                    Toast.show({
                      type: "error",
                      text1: "Missing data",
                      text2: "Please fill reps.",
                    });
                    return;
                  }
                }

                onAddSet(index);
              }}
              label="Add Set"
            />
          </View>
        </>
      )}
    </View>
  );
}
