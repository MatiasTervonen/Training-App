import { useState } from "react";
import NotesInput from "@/components/NotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import SelectInput from "@/components/Selectinput";
import { full_gym_exercises, full_gym_session } from "@/types/models";
import GroupExercises from "@/components/gym/lib/GroupExercises";
import { handleError } from "@/utils/handleError";
import Toast from "react-native-toast-message";
import { View, ScrollView } from "react-native";
import AppText from "../AppText";
import { editSession } from "@/api/gym/edit-session";
import { LinearGradient } from "expo-linear-gradient";

type EditGymSessionProps = {
  gym_session: full_gym_session;
  onClose: () => void;
  onSave?: () => void;
};

const isCardioExercise = (exercise: full_gym_exercises) =>
  exercise.gym_exercises.main_group?.toLowerCase() === "cardio";

export default function EditGym({
  gym_session,
  onClose,
  onSave,
}: EditGymSessionProps) {
  const [title, setValue] = useState(gym_session.title);
  const [notes, setNotes] = useState(gym_session.notes);
  const [duration, setDuration] = useState(gym_session.duration);
  const [exercises, setExercises] = useState(gym_session.gym_session_exercises);
  const [isSaving, setIsSaving] = useState(false);

  const formattedExercises = exercises.map((exercise) => ({
    exercise_id: exercise.gym_exercises.id,
    superset_id: exercise.superset_id || null,
    notes: exercise.notes || "",
    sets: exercise.gym_sets.map((set) => ({
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe,
      time_min: set.time_min,
      distance_meters: set.distance_meters,
    })),
  }));

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      await editSession({
        id: gym_session.id,
        title,
        notes,
        duration,
        exercises: formattedExercises,
      });

      await onSave?.();
      onClose();
    } catch (error) {
      handleError(error, {
        message: "Error editing gym session",
        route: "/api/gym/edit-session",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: "Error editing gym session",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof (typeof exercises)[0]["gym_sets"][0],
    value: string
  ) => {
    const updated = [...exercises];

    updated[exIndex].gym_sets[setIndex] = {
      ...updated[exIndex].gym_sets[setIndex],
      [field]: value,
    };
    setExercises(updated);
  };

  const handleUpdateExerciseNotes = (exIndex: number, newNotes: string) => {
    const updated = [...exercises];
    updated[exIndex].notes = newNotes;
    setExercises(updated);
  };

  const groupedExercises = GroupExercises(gym_session.gym_session_exercises);

  return (
    <ScrollView className="px-4">
      <View className="my-10">
        <View className="gap-5">
          <AppText className={` text-gray-100 text-xl text-center`}>
            Edit Your Gym Session
          </AppText>
          <View>
            <AppInput
              value={title || ""}
              onChangeText={setValue}
              placeholder="Session title..."
              label="Session Title..."
            />
          </View>
          <View>
            <AppInput
              value={duration.toString()}
              onChangeText={(val) => setDuration(Number(val))}
              placeholder="Duration in seconds..."
              label="Duration (seconds)..."
              keyboardType="numeric"
            />
          </View>
          <View>
            <NotesInput
              value={notes || ""}
              onChangeText={setNotes}
              placeholder="Write your notes here..."
              label="Session Notes..."
            />
          </View>
        </View>
        {Object.entries(groupedExercises).map(([superset_id, group]) => (
          <LinearGradient
            key={superset_id}
            colors={["#1e3a8a", "#0f172a", "#0f172a"]}
            start={{ x: 1, y: 0 }} // bottom-left
            end={{ x: 0, y: 1 }} // top-right
            className={`mt-10  rounded-md ${
              group.length > 1
                ? "border-2 border-blue-700"
                : "border-2 border-gray-600"
            }`}
          >
            {group.length > 1 && (
              <AppText className="text-lg text-gray-100 text-center my-2">
                Super-Set
              </AppText>
            )}

            {group.map(({ exercise, index }) => (
              <View key={index} className="w-full py-2 px-4 mb-4">
                <View className="justify-between mb-2">
                  <AppText className="text-lg text-gray-100 ">
                    {index + 1}. {exercise.gym_exercises.name}
                  </AppText>
                  <View className="">
                    <AppText className="text-sm text-gray-300">
                      {exercise.gym_exercises.muscle_group} /{" "}
                      {exercise.gym_exercises.equipment}
                    </AppText>
                  </View>
                </View>
                <View className="my-5 min-h-[80px]">
                  <NotesInput
                    value={exercise.notes || ""}
                    onChangeText={(newNotes) =>
                      handleUpdateExerciseNotes(index, newNotes)
                    }
                    placeholder="Add your notes here..."
                    label={`Notes for ${exercise.gym_exercises.name}...`}
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

                {exercise.gym_sets.map((set, setIndex) => (
                  <View
                    key={setIndex}
                    className={` flex-row items-center my-2  ${
                      set.rpe === "Failure"
                        ? "bg-red-500 text-white"
                        : "text-gray-100"
                    } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                  >
                    {isCardioExercise(exercise) ? (
                      <>
                        <View className="flex-row items-center justify-between gap-2 px-2 flex-1">
                          <View>
                            <AppText className="p-2 text-xl">
                              {setIndex + 1}
                            </AppText>
                          </View>
                          <View className="flex-1">
                            <AppInput
                              placeholder="Time (min)"
                              keyboardType="numeric"
                              value={Number(set.time_min).toString()}
                              onChangeText={(val) =>
                                handleUpdateSet(
                                  index,
                                  setIndex,
                                  "time_min",
                                  val
                                )
                              }
                            />
                          </View>
                          <View className="flex-1">
                            <AppInput
                              placeholder="Length (meters)"
                              keyboardType="numeric"
                              value={Number(set.distance_meters).toString()}
                              onChangeText={(val) =>
                                handleUpdateSet(
                                  index,
                                  setIndex,
                                  "distance_meters",
                                  val
                                )
                              }
                            />
                          </View>
                        </View>
                      </>
                    ) : (
                      <View className="flex-row gap-2 items-center justify-between px-2 flex-1">
                        <View className="">
                          <AppText className="p-2 text-xl">
                            {setIndex + 1}
                          </AppText>
                        </View>
                        <View className="flex-1">
                          <AppInput
                            placeholder="Weight..."
                            keyboardType="numeric"
                            value={Number(set.weight).toString()}
                            onChangeText={(val) =>
                              handleUpdateSet(index, setIndex, "weight", val)
                            }
                          />
                        </View>
                        <View className="flex-1">
                          <AppInput
                            placeholder="Reps..."
                            keyboardType="numeric"
                            value={Number(set.reps).toString()}
                            onChangeText={(val) =>
                              handleUpdateSet(index, setIndex, "reps", val)
                            }
                          />
                        </View>
                        <View className=" flex-1">
                          <SelectInput
                            label={`${index + 1}. ${
                              exercise.gym_exercises.name
                            }`}
                            value={set.rpe}
                            onChange={(val) =>
                              handleUpdateSet(index, setIndex, "rpe", val)
                            }
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
                ))}
              </View>
            ))}
          </LinearGradient>
        ))}
        <View className="py-10 mx-10">
          <SaveButton onPress={handleSubmit} />
        </View>
      </View>
      <FullScreenLoader visible={isSaving} message="Saving..." />
    </ScrollView>
  );
}
