import { useState, useEffect, useRef } from "react";
import { gym_exercises } from "@/types/models";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, View, SectionList } from "react-native";
import { getExercises } from "@/api/gym/get-exercises";
import { getRecentExercises } from "@/api/gym/recent-exercises";
import AppInput from "../AppInput";
import AppText from "../AppText";

type Props = {
  onSelect: (exercise: gym_exercises) => void;
  resetTrigger?: number;
};

export default function ExerciseDropdown({ onSelect, resetTrigger }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExercises, setFilteredExercises] = useState<gym_exercises[]>(
    []
  );
  const dropdownRef = useRef<View | null>(null);
  const [showDropdown, setShowDropdown] = useState(true);

  const {
    data: exercises,
    error: exercisesError,
    isLoading: isExercisesLoading,
  } = useQuery<gym_exercises[]>({
    queryKey: ["exercises"],
    queryFn: async () => await getExercises(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const {
    data: recentExercises,
    error: recentError,
    isLoading: isRecentLoading,
  } = useQuery<gym_exercises[]>({
    queryKey: ["recentExercises"],
    queryFn: async () => await getRecentExercises(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const isLoading = isExercisesLoading || isRecentLoading;
  const isError = exercisesError || recentError;

  const allExercises = exercises || [];

  const recentExercisesList = recentExercises || [];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowDropdown(true);

    if (value.length > 0) {
      const filteredExercises = allExercises.filter((exercise) => {
        const combinedText =
          `${exercise.name} ${exercise.equipment} ${exercise.muscle_group} ${exercise.main_group}`.toLowerCase();
        return value
          .toLowerCase()
          .split(" ")
          .every((word) => combinedText.includes(word));
      });
      setFilteredExercises(filteredExercises);
    } else {
    }
  };

  const handleSelectExercise = (exercise: gym_exercises) => {
    setSearchQuery(exercise.name + " " + "(" + exercise.equipment + ")");
    onSelect(exercise);
    setShowDropdown(false);
  };

  useEffect(() => {
    setShowDropdown(true);
    setSearchQuery("");
  }, [resetTrigger]);

  const sections = [];

  if (!isError && !isLoading) {
    if (recentExercisesList.length > 0 && searchQuery.length === 0) {
      sections.push({ title: "Recent Exercises", data: recentExercisesList });
    }

    sections.push({
      title: "All Exercises",
      data: searchQuery.length > 0 ? filteredExercises : allExercises,
    });
  }

  return (
    <View className="px-2 w-full z-50">
      <View className="mt-10 w-full px-14">
        <AppInput
          value={searchQuery}
          placeholder="Search exercises..."
          autoComplete="off"
          onChangeText={handleSearchChange}
          spellCheck={false}
        />
      </View>

      {showDropdown && (
        <View
          ref={dropdownRef}
          className="w-full border rounded-md 
                    bg-slate-900 border-gray-100 touch-pan-y mt-10 h-[83%]"
        >
          {isLoading || isError ? (
            <View className="gap-6 items-center justify-center z-50 text-center mt-10">
              {isLoading && (
                <>
                  <AppText className="text-gray-100 text-xl">
                    Loading exercises...
                  </AppText>
                  <ActivityIndicator />
                </>
              )}
              {isError && (
                <AppText className="text-red-500">
                  Failed to load exercises. Try again!
                </AppText>
              )}
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                return (
                  <Pressable
                    className="w-full text-left px-4 py-2 z-40 text-gray-100 border-b"
                    onPress={() => handleSelectExercise(item)}
                  >
                    <View className="justify-between">
                      <View className="flex-row justify-between items-center">
                        <AppText>{item.name} </AppText>
                        <AppText className="text-sm text-gray-300">
                          {item.muscle_group}
                        </AppText>
                      </View>
                      <AppText className="text-sm text-gray-400">
                        {item.equipment}
                      </AppText>
                    </View>
                  </Pressable>
                );
              }}
              renderSectionHeader={({ section: { title } }) => (
                <AppText className="text-gray-100 text-center bg-slate-600 rounded-t-md">
                  {title}
                </AppText>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}
