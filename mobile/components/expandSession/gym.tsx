import { formatDate } from "@/lib/formatDate";
import { useUserStore } from "@/lib/stores/useUserStore";
import { full_gym_session, full_gym_exercises } from "@/types/models";
import GroupExercises from "@/components/gym/lib/GroupExercises";
import { View, ScrollView } from "react-native";
import AppText from "../AppText";
import { LinearGradient } from "expo-linear-gradient";
import PageContainer from "../PageContainer";
import { History } from "lucide-react-native";
import { getLastExerciseHistory } from "@/database/gym/last-exercise-history";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import AnimatedButton from "../buttons/animatedButton";
import ExerciseHistoryModal from "../gym/ExerciseHistoryModal";

const formatDuration = (seconds: number) => {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default function GymSession(gym_session: full_gym_session) {
  const [exerciseId, setExerciseId] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const groupedExercises = GroupExercises(
    gym_session.gym_session_exercises || []
  );

  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  const isCardioExercise = (exercise: full_gym_exercises) =>
    exercise.gym_exercises.main_group.toLowerCase() === "cardio";

  const {
    data: history = [],
    error: historyError,
    isLoading,
  } = useQuery({
    queryKey: ["last-exercise-history", exerciseId],
    queryFn: () => getLastExerciseHistory({ exerciseId }),
    enabled: isHistoryOpen && !!exerciseId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const openHistory = (exerciseId: string) => {
    setExerciseId(exerciseId);
    setIsHistoryOpen(true);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <PageContainer className="mb-10">
        <View className="gap-2 justify-center items-center">
          <AppText className="text-lg text-gray-400">
            {formatDate(gym_session.created_at)}
          </AppText>
          <AppText className="text-2xl mt-2 text-center">
            {gym_session.title}
          </AppText>
          <AppText className="text-lg mt-2">
            Duration: {formatDuration(gym_session.duration)}
          </AppText>
          {gym_session.notes && (
            <AppText className="text-lg mt-4 text-gray-200 whitespace-pre-wrap break-words overflow-hidden">
              {gym_session.notes}
            </AppText>
          )}
        </View>
        {Object.entries(groupedExercises).map(([superset_id, group]) => (
          <LinearGradient
            key={superset_id}
            colors={["#1e3a8a", "#0f172a", "#0f172a"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            className={`mt-10 rounded-md overflow-hidden  ${
              group.length > 1
                ? "border-2 border-blue-700"
                : "border-2 border-gray-600"
            }`}
          >
            {group.length > 1 && (
              <AppText className="text-xl text-gray-100 my-2 text-center">
                Super-Set
              </AppText>
            )}
            {group.map(({ exercise, index }) => (
              <View key={index} className="py-2 px-4 mb-4">
                <View className="justify-between flex-col mb-2">
                  <View className="flex-row items-center">
                    <AppText
                      className="text-xl text-gray-100 flex-1 mr-4"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {index + 1}. {exercise.gym_exercises.name}
                    </AppText>
                    <AnimatedButton
                      hitSlop={10}
                      onPress={() => openHistory(exercise.gym_exercises.id)}
                    >
                      <History color="#f3f4f6" />
                    </AnimatedButton>
                  </View>
                  <View className="flex-row items-center ">
                    <AppText className="text-md text-gray-400 mt-1">
                      {exercise.gym_exercises.muscle_group} /{" "}
                      {exercise.gym_exercises.equipment}
                    </AppText>
                  </View>
                </View>
                <AppText className="py-2 whitespace-pre-wrap break-words overflow-hidden">
                  {exercise.notes || ""}
                </AppText>

                <View className="w-full">
                  <View className="text-gray-300 border-b border-gray-300 flex-row">
                    {isCardioExercise(exercise) ? (
                      <>
                        <View className="w-[20%]">
                          <AppText className="p-2 text-lg">Set</AppText>
                        </View>
                        <View className="w-[30%] flex-row items-center">
                          <AppText className="p-2 text-lg">Time</AppText>
                          <AppText className="text-sm">(min)</AppText>
                        </View>
                        <View className="w-[30%] flex-row items-center">
                          <AppText className="p-2 text-lg">Distance</AppText>
                          <AppText className="text-sm">(meters)</AppText>
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
                <View>
                  {exercise.gym_sets.map((set, setIndex) => (
                    <View
                      key={setIndex}
                      className={`border-b border-gray-300 flex-row  items-center  ${
                        set.rpe === "Failure"
                          ? "bg-red-500 text-white"
                          : "text-gray-100"
                      } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""} border-b`}
                    >
                      {isCardioExercise(exercise) ? (
                        <>
                          <View className="w-[20%] text-center">
                            <AppText className="p-2 text-lg ">
                              {setIndex + 1}
                            </AppText>
                          </View>
                          <View className="w-[30%] text-center">
                            <AppText className="p-2 text-lg ">
                              {set.time_min}
                            </AppText>
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
                            <AppText className="p-2 text-lg">
                              {setIndex + 1}
                            </AppText>
                          </View>
                          <View className="w-[28%] text-center">
                            <AppText className="p-2 text-lg">
                              {set.weight} {weightUnit}
                            </AppText>
                          </View>
                          <View className="w-[20%] text-center">
                            <AppText className="p-2 text-lg">
                              {set.reps}
                            </AppText>
                          </View>
                          <View className="w-[30%] text-center">
                            <AppText className="p-2 text-lg">{set.rpe}</AppText>
                          </View>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </LinearGradient>
        ))}
      </PageContainer>

      <ExerciseHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        isLoading={isLoading}
        history={Array.isArray(history) ? history : []}
        error={historyError ? historyError.message : null}
      />
    </ScrollView>
  );
}
