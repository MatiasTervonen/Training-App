import { formatDate } from "@/lib/formatDate";
import GroupTemplateExercise from "@/components/gym/lib/GroupTemplateExercises";
import { full_gym_template } from "@/types/models";
import { ScrollView, View } from "react-native";
import AppText from "../AppText";
import AppButton from "@/components/buttons/AppButton";
import PageContainer from "../PageContainer";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  item: full_gym_template;
  onStartWorkout: () => void;
};

export default function GymTemplate({ item, onStartWorkout }: Props) {
  const groupedExercises = GroupTemplateExercise(
    item.gym_template_exercises || []
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <PageContainer className="mb-10">
        <View className="mb-5  justify-center items-center">
          <AppText className="text-sm text-gray-300">
            Created: {formatDate(item.created_at)}
          </AppText>
          {item.updated_at && (
            <AppText className="text-sm text-yellow-500 mt-2 text-center">
              Updated: {formatDate(item.updated_at)}
            </AppText>
          )}
          <AppText className="text-xl text-center mt-5">{item.name}</AppText>
        </View>
        {Object.entries(groupedExercises).map(([superset_id, group]) => (
          <LinearGradient
            key={superset_id}
            colors={["#1e3a8a", "#0f172a", "#0f172a"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            className={`mt-6 px-4 py-2 rounded-md overflow-hidden shadow-md  ${
              group.length > 1
                ? "border-2 border-blue-700"
                : "border-2 border-gray-600"
            }`}
          >
            {group.length > 1 && (
              <AppText className="text-lg text-gray-100 mb-2 text-center">
                Super-Set
              </AppText>
            )}
            {group.map((exercise) => (
              <View key={exercise.id}>
                <View className="flex-row items-center justify-between">
                  <AppText
                    className="text-lg text-gray-100 mr-8 flex-1"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {exercise.gym_exercises.name}
                  </AppText>
                  <AppText className="text-gray-300">
                    {exercise.gym_exercises.muscle_group}
                  </AppText>
                </View>
                <AppText className="text-gray-300 mt-2">
                  {exercise.gym_exercises.equipment}
                </AppText>
              </View>
            ))}
          </LinearGradient>
        ))}
        <View className="mt-10">
          <AppButton onPress={onStartWorkout} label="Start Workout" />
        </View>
      </PageContainer>
    </ScrollView>
  );
}
