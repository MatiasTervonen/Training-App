import { formatDate, formatDuration, formatTime } from "@/lib/formatDate";
import { useUserStore } from "@/lib/stores/useUserStore";
import { FullGymSession } from "@/database/gym/get-full-gym-session";
import GroupExercises from "@/features/gym/lib/GroupExercises";
import { View, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { LinearGradient } from "expo-linear-gradient";
import PageContainer from "@/components/PageContainer";
import { History, Clock } from "lucide-react-native";
import { getLastExerciseHistory } from "@/database/gym/last-exercise-history";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AnimatedButton from "@/components/buttons/animatedButton";
import ExerciseHistoryModal from "@/features/gym/components/ExerciseHistoryModal";
import StatCard from "@/components/StatCard";

export default function GymSession(gym_session: FullGymSession) {
  const { t } = useTranslation("gym");
  const [exerciseId, setExerciseId] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const groupedExercises = GroupExercises(
    gym_session.gym_session_exercises || [],
  );

  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  const stats = useMemo(() => {
    const exercises = gym_session.gym_session_exercises || [];
    const exerciseCount = exercises.length;
    const totalSets = exercises.reduce(
      (sum, ex) => sum + (ex.gym_sets?.length ?? 0),
      0,
    );
    const muscleGroupsHit = new Set(
      exercises
        .map((ex) => ex.gym_exercises?.muscle_group)
        .filter(Boolean),
    ).size;

    return { exerciseCount, totalSets, muscleGroupsHit };
  }, [gym_session.gym_session_exercises]);

  const sessionStats = gym_session.session_stats;
  const totalVolume = sessionStats?.total_volume ?? 0;
  const calories = sessionStats?.calories ?? 0;

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}t ${weightUnit}`;
    }
    return `${Math.round(volume)} ${weightUnit}`;
  };

  const isCardioExercise = (exercise: {
    gym_exercises: { main_group: string };
  }) => exercise.gym_exercises?.main_group.toLowerCase() === "cardio";

  const translateRpe = (rpe: string) => {
    const rpeMap: Record<string, string> = {
      "Warm-up": "1",
      Easy: "2",
      Medium: "3",
      Hard: "4",
      Failure: "5",
    };
    return rpeMap[rpe] || rpe;
  };

  const {
    data: history = [],
    error: historyError,
    isLoading,
  } = useQuery({
    queryKey: ["last-exercise-history", exerciseId],
    queryFn: () => getLastExerciseHistory({ exerciseId }),
    enabled: isHistoryOpen && !!exerciseId,
  });

  const openHistory = (exerciseId: string) => {
    setExerciseId(exerciseId);
    setIsHistoryOpen(true);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <PageContainer className="mb-10">
        <View>
          <AppText className="text-gray-400 text-center">
            {formatDate(gym_session.created_at)}
          </AppText>
          <LinearGradient
            colors={["#1e3a8a", "#0f172a", "#0f172a"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="items-center p-5 rounded-lg overflow-hidden shadow-md mt-5 gap-4"
          >
            <AppText className="text-2xl text-center">
              {gym_session.title}
            </AppText>
            <View className="flex-row items-center gap-3">
              <Clock color="#f3f4f6" />
              <AppText className="text-lg text-center">
                {formatTime(gym_session.start_time)} -{" "}
                {formatTime(gym_session.end_time)}
              </AppText>
            </View>

            <View className="w-full gap-2">
              <View className="flex-row gap-2">
                <StatCard
                  label={t("gym.session.duration")}
                  value={formatDuration(gym_session.duration)}
                />
                <StatCard
                  label={t("gym.session.totalVolume")}
                  value={formatVolume(totalVolume)}
                />
                <StatCard
                  label={t("gym.session.calories")}
                  value={String(Math.round(calories))}
                />
              </View>
              <View className="flex-row gap-2">
                <StatCard
                  label={t("gym.session.exercises")}
                  value={String(stats.exerciseCount)}
                />
                <StatCard
                  label={t("gym.session.totalSets")}
                  value={String(stats.totalSets)}
                />
                <StatCard
                  label={t("gym.session.muscleGroups")}
                  value={String(stats.muscleGroupsHit)}
                />
              </View>
            </View>

            {gym_session.notes && (
              <BodyText className="text-gray-200 whitespace-pre-wrap break-words overflow-hidden">
                {gym_session.notes}
              </BodyText>
            )}
          </LinearGradient>
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
              <AppText className="text-lg text-gray-100 my-2 text-center">
                {t("gym.session.superSet")}
              </AppText>
            )}
            {group.map(({ exercise, index }) => (
              <View key={exercise.id} className="py-2 px-4 mb-4">
                <View className="justify-between flex-col mb-2">
                  <View className="flex-row items-center">
                    <AppText
                      className="text-lg text-gray-100 flex-1 mr-4"
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
                    <AppText className="text-gray-400 mt-1">
                      {t(
                        `gym.equipment.${exercise.gym_exercises.equipment?.toLowerCase()}`,
                      )}{" "}
                      /{" "}
                      {t(
                        `gym.muscleGroups.${exercise.gym_exercises.muscle_group?.toLowerCase().replace(/ /g, "_")}`,
                      )}
                    </AppText>
                  </View>
                </View>
                {exercise.notes && (
                  <BodyText className="py-2 overflow-hidden">
                    {exercise.notes || ""}
                  </BodyText>
                )}

                <View className="w-full">
                  <View className="text-gray-300 border-b border-gray-300 flex-row">
                    {isCardioExercise(exercise) ? (
                      <>
                        <View className="flex-1 items-center">
                          <AppText className="p-2 text-lg">
                            {t("gym.session.set")}
                          </AppText>
                        </View>
                        <View className="flex-1 items-center">
                          <AppText className="p-2 text-lg">
                            {t("gym.session.time")}
                          </AppText>
                          <AppText>({t("gym.session.min")})</AppText>
                        </View>
                        <View className="flex-1 items-center">
                          <AppText className="p-2 text-lg">
                            {t("gym.session.distance")}
                          </AppText>
                          <AppText className="text-lg">
                            ({t("gym.session.meters")})
                          </AppText>
                        </View>
                        <View className="w-8" />
                      </>
                    ) : (
                      <>
                        <View className="flex-1 items-center">
                          <AppText className="p-2 text-lg">
                            {t("gym.session.set")}
                          </AppText>
                        </View>
                        <View className="flex-1 items-center">
                          <AppText className="p-2 text-lg">
                            {t("gym.session.weight")}
                          </AppText>
                        </View>
                        <View className="flex-1 items-center">
                          <AppText className="p-2 text-lg">
                            {t("gym.session.reps")}
                          </AppText>
                        </View>
                        <View className="flex-1 items-center">
                          <AppText className="p-2 text-lg">
                            {t("gym.session.rpe")}
                          </AppText>
                        </View>
                        <View className="w-8" />
                      </>
                    )}
                  </View>
                </View>
                <View>
                  {exercise.gym_sets.map((set, setIndex) => (
                    <View
                      key={setIndex}
                      className={`border-b border-gray-300 flex-row items-center  ${
                        set.rpe === "Failure"
                          ? "bg-red-500 text-white"
                          : "text-gray-100"
                      } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""} border-b`}
                    >
                      {isCardioExercise(exercise) ? (
                        <>
                          <View className="flex-1 items-center">
                            <AppText className="p-2">{setIndex + 1}</AppText>
                          </View>
                          <View className="flex-1 items-center">
                            <AppText className="p-2">{set.time_min}</AppText>
                          </View>
                          <View className="flex-1 items-center">
                            <AppText className="p-2">
                              {set.distance_meters}
                            </AppText>
                          </View>
                          <View className="w-8" />
                        </>
                      ) : (
                        <>
                          <View className="flex-1 items-center">
                            <AppText className="p-2">{setIndex + 1}</AppText>
                          </View>
                          <View className="flex-1 items-center">
                            <AppText className="p-2">
                              {set.weight} {weightUnit}
                            </AppText>
                          </View>
                          <View className="flex-1 items-center">
                            <AppText className="p-2">{set.reps}</AppText>
                          </View>
                          <View className="flex-1 items-center">
                            <AppText className="p-2" numberOfLines={1}>
                              {set.rpe ? translateRpe(set.rpe) : ""}
                            </AppText>
                          </View>
                          <View className="w-8" />
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
