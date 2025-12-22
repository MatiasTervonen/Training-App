import { useState, useEffect } from "react";
import { gym_exercises } from "@/types/models";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  View,
  SectionList,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { getExercises } from "@/database/gym/get-exercises";
import { getRecentExercises } from "@/database/gym/recent-exercises";
import AppInput from "../AppInput";
import AppText from "../AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useDebouncedCallback } from "use-debounce";

type Props = {
  onSelect: (exercise: gym_exercises) => void;
  resetTrigger?: number;
};

export default function ExerciseDropdown({ onSelect, resetTrigger }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  const {
    data,
    error: exercisesError,
    isLoading: isExercisesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["exercises", searchQuery],
    queryFn: ({ pageParam = 0 }) =>
      getExercises({ pageParam, limit: 50, search: searchQuery }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const {
    data: recentExercises,
    error: recentError,
    isLoading: isRecentLoading,
  } = useQuery({
    queryKey: ["recentExercises"],
    queryFn: () => getRecentExercises(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const isLoading = isExercisesLoading || isRecentLoading;
  const isError = exercisesError || recentError;

  const allExercises = data?.pages.flatMap((page) => page.data) || [];

  const recentExercisesList = recentExercises || [];

  const handleSearchChange = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 400);

  const handleSelectExercise = (exercise: gym_exercises) => {
    setSearchQuery(exercise.name + " " + "(" + exercise.equipment + ")");
    onSelect(exercise);
  };

  useEffect(() => {
    setSearchQuery("");
  }, [resetTrigger]);

  const sections = [];

  if (!isError && !isLoading) {
    if (recentExercisesList.length > 0 && searchQuery.length === 0) {
      sections.push({
        title: "Recent Exercises",
        data: recentExercisesList,
        key: "recent",
      });
    }

    sections.push({
      title: "All Exercises",
      data: allExercises,
    });
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="w-full z-50 flex-1">
        <View className="mt-10 w-full px-8">
          <AppInput
            value={inputValue}
            placeholder="Search exercises..."
            autoComplete="off"
            onChangeText={(text) => {
              setInputValue(text);
              handleSearchChange(text);
            }}
            spellCheck={false}
          />
        </View>

        <View
          className="w-full  
                    bg-slate-900 border border-gray-100 mt-10 flex-1 rounded-md overflow-hidden"
        >
          {isLoading || isError || allExercises.length === 0 ? (
            <View className="gap-6 items-center justify-center z-50 text-center mt-20">
              {isLoading && (
                <>
                  <AppText className="text-xl">Loading exercises...</AppText>
                  <ActivityIndicator />
                </>
              )}
              {isError && (
                <AppText className="text-red-500 text-xl">
                  Failed to load exercises. Try again!
                </AppText>
              )}
              {!isLoading && allExercises.length === 0 && (
                <AppText className="text-lg text-gray-300">
                  No eexercises found.
                </AppText>
              )}
            </View>
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
                    onPress={() => handleSelectExercise(item)}
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
                          {item.muscle_group}
                        </AppText>
                      </View>
                      <AppText className="text-md text-gray-400">
                        {item.equipment}
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
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View className="items-center justify-center gap-4 my-10">
                    <ActivityIndicator size="large" color="#193cb8" />
                  </View>
                ) : hasNextPage ? (
                  <View className="h-20" />
                ) : null
              }
            />
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
