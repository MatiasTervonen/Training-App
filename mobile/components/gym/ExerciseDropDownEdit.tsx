import { useState, useEffect, useRef } from "react";
import { ActivityIndicator, View, SectionList } from "react-native";
import GetUserExercises from "@/api/gym/user-exercises";
import { useQuery } from "@tanstack/react-query";
import AppInput from "../AppInput";
import AppText from "../AppText";
import AnimatedButton from "../animatedButton";

type Props = {
  onSelect: (exercise: userExercise) => void;
  resetTrigger?: number;
};

type userExercise = {
  id: string;
  user_id: string | null;
  name: string;
  equipment: string;
  muscle_group: string;
  main_group: string;
  created_at?: string;
};

export default function ExerciseDropdownEdit({
  onSelect,
  resetTrigger,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExercises, setFilteredExercises] = useState<userExercise[]>(
    []
  );
  const dropdownRef = useRef<View | null>(null);
  const [showDropdown, setShowDropdown] = useState(true);

  const {
    data: exercises,
    error: exercisesError,
    isLoading: isExercisesLoading,
  } = useQuery<userExercise[]>({
    queryKey: ["userExercises"],
    queryFn: GetUserExercises,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const isLoading = isExercisesLoading;
  const isError = exercisesError;

  const allExercises = exercises || [];

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

  const handleSelectExercise = (exercise: userExercise) => {
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
    sections.push({
      title: "My Exercises",
      data: searchQuery.length > 0 ? filteredExercises : allExercises,
    });
  }

  return (
    <>
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
                       bg-slate-900 border-gray-100  mt-10 h-[83%]"
          >
            {isLoading || isError ? (
              <View className="gap-6 items-center justify-center z-50 text-center mt-10">
                {isLoading && (
                  <>
                    <AppText className=" text-xl">
                      Loading exercises...
                    </AppText>
                    <ActivityIndicator />
                  </>
                )}
                {isError && (
                  <AppText className="text-red-500 text-xl">
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
                  <AppText className=" text-center bg-slate-600 rounded-t-md text-lg">
                    {title}
                  </AppText>
                )}
              />
            )}
          </View>
        )}
      </View>
    </>
  );
}
