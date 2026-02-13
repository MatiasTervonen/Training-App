import { useState } from "react";
import {
  ActivityIndicator,
  View,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { getUserExercises } from "@/database/gym/user-exercises";
import { useQuery } from "@tanstack/react-query";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";

type Props = {
  onSelect: (exercise: userExercise) => void;
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
  onSelect
}: Props) {
  const { t } = useTranslation("gym");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExercises, setFilteredExercises] = useState<userExercise[]>(
    []
  );

  const {
    data: exercises,
    error: exercisesError,
    isLoading: isExercisesLoading,
  } = useQuery<userExercise[]>({
    queryKey: ["userExercises"],
    queryFn: getUserExercises,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const isLoading = isExercisesLoading;
  const isError = exercisesError;


  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (value.length > 0) {
      const filteredExercises = exercises?.filter((exercise) => {
        const combinedText =
          `${exercise.name} ${exercise.equipment} ${exercise.muscle_group} ${exercise.main_group}`.toLowerCase();
        return value
          .toLowerCase()
          .split(" ")
          .every((word) => combinedText.includes(word));
      });
      setFilteredExercises(filteredExercises || []);
    } else {
      setFilteredExercises([]);
    }
  };

  const handleSelectExercise = (exercise: userExercise) => {
    setSearchQuery(exercise.name + " " + "(" + exercise.equipment + ")");
    onSelect(exercise);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="px-2 w-full z-50 flex-1">
        <View className="mt-10 w-full px-14">
          <AppInput
            value={searchQuery}
            placeholder={t("gym.exerciseDropdown.searchPlaceholder")}
            autoComplete="off"
            setValue={handleSearchChange}
            spellCheck={false}
          />
        </View>

        <View
          className="w-full border rounded-md 
                       bg-slate-900 border-gray-100  mt-10 flex-1"
        >
          {isError ? (
            <AppText className="text-red-500 text-xl mt-20 text-center">
              {t("gym.exerciseDropdown.loadError")}
            </AppText>
          ) : isLoading ? (
            <View className="items-center justify-center gap-3 mt-20">
              <AppText className=" text-xl">{t("gym.exerciseDropdown.loadingExercises")}</AppText>
              <ActivityIndicator />
            </View>
          ) : exercises?.length === 0 ? (
            <View className="items-center self-center gap-3 text-lg px-5 mt-20">
              <AppText>{t("gym.exerciseDropdown.noExercisesFound")}</AppText>
              <AppText>{t("gym.exerciseDropdownEdit.addNewExercise")}</AppText>
            </View>
          ) : searchQuery.length > 0 && filteredExercises?.length === 0 ? (
            <View className="items-center self-center gap-3 text-lg px-5 mt-20">
              <AppText>{t("gym.exerciseDropdownEdit.noMatching")}</AppText>
            </View>
          ) : (
            <FlatList
              data={searchQuery.length > 0 ? filteredExercises : exercises || []}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={
                <AppText className="text-center text-lg bg-blue-600 rounded-t-md">
                  {t("gym.exerciseDropdownEdit.myExercises")}
                </AppText>
              }
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
            />
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
