import { Pressable, View } from "react-native";
import AppText from "@/components/AppText";
import { ExerciseEntry } from "@/types/session";
import DropdownMenu from "../DropdownMenu";
import { Ellipsis, SquareX } from "lucide-react-native";
import NotesInput from "../NotesInput";
import AppInput from "../AppInput";
import { useUserStore } from "@/lib/stores/useUserStore";
import { confirmAction } from "@/lib/confirmAction";
import SelectInput from "../Selectinput";

type ExerciseCardProps = {
  index: number;
  exercise: ExerciseEntry;
  input: { weight: string; reps: string; rpe: string };
  onUpdateExercise: (index: number, updated: ExerciseEntry) => void;
  onDeleteExercise: (index: number) => void;
  lastExerciseHistory: (index: number) => void;
  onInputChange: (
    index: number,
    field: "weight" | "reps" | "rpe",
    value: number | string
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
  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  return (
    <View className="py-2 px-4">
      <View className="flex-row items-center justify-between">
        <View>
          <AppText className="text-gray-100 text-lg">
            {index + 1}. {exercise.name}
          </AppText>
          <AppText className="text-sm text-gray-400">
            {exercise.equipment} / {exercise.muscle_group}
          </AppText>
        </View>
        <DropdownMenu
          button={<Ellipsis size={20} color="#f3f4f6" />}
          onDelete={() => onDeleteExercise(index)}
          onChange={() => onChangeExercise(index)}
        />
      </View>
      {mode === "session" && (
        <>
          <View className="my-4">
            <View className="min-h-[80px]">
              <NotesInput
                label={`Notes for ${exercise.name}`}
                placeholder="Add your notes here..."
                value={exercise.notes || ""}
                onChangeText={(newNotes) =>
                  onUpdateExercise(index, { ...exercise, notes: newNotes })
                }
              />
            </View>
          </View>

          <View className="w-full  text-gray-100">
            <View className="text-gray-300 border-b border-gray-300 flex-row justify-between px-4">
              <AppText className="p-2">Set</AppText>
              {isCardioExercise(exercise) ? (
                <>
                  <AppText className="p-2">Time (min)</AppText>
                  <AppText className="p-2">Duration (km)</AppText>
                </>
              ) : (
                <>
                  <AppText className="p-2">Weight</AppText>
                  <AppText className="p-2">Reps</AppText>
                  <AppText className="p-2">RPE</AppText>
                </>
              )}
            </View>
          </View>

          <View>
            {exercise.sets.map((set, setIndex) => (
              <View
                key={setIndex}
                className={`border-b ${
                  set.rpe === "Failure" ? "bg-red-800" : ""
                } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
              >
                {isCardioExercise(exercise) ? (
                  <>
                    <View className="p-2">{setIndex + 1}</View>
                    <View className="p-2">{set.weight} min</View>
                    <View className="p-2">{set.rpe}</View>
                  </>
                ) : (
                  <>
                    <View className="p-2">{setIndex + 1}</View>
                    <View className="p-2">
                      {set.weight} {weightUnit}
                    </View>
                    <View className="p-2">{set.reps}</View>
                    <View className="p-2">{set.rpe}</View>
                  </>
                )}
                <View>
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
                    <SquareX />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View className="flex-row items-center justify-center gap-4 mt-6">
            {isCardioExercise(exercise) ? (
              <>
                <View className="flex-row items-center gap-5">
                  <AppInput
                    placeholder="Time in min..."
                    keyboardType="numeric"
                    value={input.weight}
                    onChange={(val) =>
                      onInputChange(index, "weight", Number(val))
                    }
                  />
                </View>
                <SelectInput
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
              </>
            ) : (
              <View className="flex-row gap-2 items-center justify-center px-2">
                <View className="w-1/3">
                  <AppInput
                    placeholder="Weight..."
                    keyboardType="numeric"
                    value={input.weight}
                    onChange={(val) =>
                      onInputChange(index, "weight", Number(val))
                    }
                  />
                </View>
                <View className="w-1/3">
                  <AppInput
                    placeholder="Reps..."
                    keyboardType="numeric"
                    value={input.reps}
                    onChange={(val) =>
                      onInputChange(index, "reps", Number(val))
                    }
                  />
                </View>
                <View className="w-1/3">
                  <SelectInput
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

          <View className="flex-row items-center justify-center gap-4 my-6">
            <Pressable
              onPress={() => onAddSet(index)}
              className="px-10 bg-blue-900 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg"
            >
              <AppText>Add Set</AppText>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
