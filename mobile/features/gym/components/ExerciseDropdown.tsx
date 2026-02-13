import { useState, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  View,
  SectionList,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { getExercises } from "@/database/gym/get-exercises";
import { getRecentExercises } from "@/database/gym/recent-exercises";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/lib/stores/useUserStore";

type Props = {
  onSelect: (exercise: any) => void;
};

export default function ExerciseDropdown({ onSelect }: Props) {
  const { t } = useTranslation("gym");
  const [searchQuery, setSearchQuery] = useState("");
  const language = useUserStore((state) => state.settings?.language ?? "en");

  const {
    data: allExercisesData,
    error: exercisesError,
    isLoading: isExercisesLoading,
  } = useQuery({
    queryKey: ["exercises", language],
    queryFn: () => getExercises(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const {
    data: recentExercises,
    error: recentError,
    isLoading: isRecentLoading,
  } = useQuery({
    queryKey: ["recentExercises", language],
    queryFn: () => getRecentExercises(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const isLoading = isExercisesLoading || isRecentLoading;
  const isError = exercisesError || recentError;

  // Filter exercises with translated values
  const allExercises = useMemo(() => {
    if (!allExercisesData) return [];
    if (!searchQuery.trim()) return allExercisesData;

    const query = searchQuery.toLowerCase();
    return allExercisesData.filter((exercise) => {
      const name = exercise.name?.toLowerCase() ?? "";
      const equipment = t(`gym.equipment.${exercise.equipment}`)?.toLowerCase() ?? "";
      const muscleGroup = t(`gym.muscleGroups.${exercise.muscle_group}`)?.toLowerCase() ?? "";
      const mainGroup = t(`gym.mainGroups.${exercise.main_group}`)?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        equipment.includes(query) ||
        muscleGroup.includes(query) ||
        mainGroup.includes(query)
      );
    });
  }, [allExercisesData, searchQuery, t]);

  const recentExercisesList = recentExercises || [];

  const sections = [];

  if (!isError && !isLoading) {
    if (recentExercisesList.length > 0 && searchQuery.length === 0) {
      sections.push({
        title: t("gym.exerciseDropdown.recentExercises"),
        data: recentExercisesList,
        key: "recent",
      });
    }

    sections.push({
      title: t("gym.exerciseDropdown.allExercises"),
      data: allExercises,
    });
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="w-full z-50 flex-1">
        <View className="mt-10 w-full px-8">
          <AppInput
            value={searchQuery}
            placeholder={t("gym.exerciseDropdown.searchPlaceholder")}
            autoComplete="off"
            onChangeText={setSearchQuery}
            spellCheck={false}
          />
        </View>

        <View
          className="w-full  
                    bg-slate-900 border border-gray-100 mt-10 flex-1 rounded-md overflow-hidden"
        >
          {isError ? (
            <AppText className="text-red-500 text-xl mt-20 text-center px-10">
              {t("gym.exerciseDropdown.loadError")}
            </AppText>
          ) : isLoading ? (
            <View className="items-center justify-center gap-3 mt-20">
              <AppText className="text-xl">
                {t("gym.exerciseDropdown.loadingExercises")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : allExercises.length === 0 ? (
            <AppText className="text-lg text-gray-300 mt-20 text-center px-10">
              {t("gym.exerciseDropdown.noExercisesFound")}
            </AppText>
          ) : (
            <SectionList
              contentContainerStyle={{
                paddingBottom: 100,
              }}
              showsVerticalScrollIndicator={false}
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                return (
                  <AnimatedButton
                    className="w-full text-left px-4 py-2 z-40 border-b border-gray-400"
                    onPress={() => onSelect(item)}
                  >
                    <View className="justify-between">
                      <View className="flex-row justify-between items-center">
                        <AppText
                          className="text-lg mb-1 mr-4 flex-1"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.name}
                        </AppText>
                        <AppText className="text-md text-gray-300 shrink-0">
                          {t(`gym.muscleGroups.${item.muscle_group}`)}
                        </AppText>
                      </View>
                      <AppText className="text-md text-gray-400">
                        {t(`gym.equipment.${item.equipment}`)}
                      </AppText>
                    </View>
                  </AnimatedButton>
                );
              }}
              renderSectionHeader={({ section: { title } }) => (
                <AppText className="text-center text-lg bg-blue-600">
                  {title}
                </AppText>
              )}
            />
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
