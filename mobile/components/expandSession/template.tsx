import { formatDate } from "@/lib/formatDate";
import GroupTemplateExercise from "@/components/gym/lib/GroupTemplateExercises";
import { full_gym_template } from "@/types/models";
import { ScrollView, View } from "react-native";
import AppText from "../AppText";
import AppButton from "@/components/buttons/AppButton";
import PageContainer from "../PageContainer";

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
            <AppText className="text-sm mt-2 text-gray-300">
              Updated: {formatDate(item.updated_at)}
            </AppText>
          )}
          <AppText className="text-xl text-center mt-5">{item.name}</AppText>
        </View>
        {Object.entries(groupedExercises).map(([superset_id, group]) => (
          <View
            key={superset_id}
            className="mt-6 bg-slate-900 rounded-md px-4 py-2 shadow-md"
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
                <AppText className="text-lg text-gray-400 mt-2">
                  {exercise.gym_exercises.equipment}
                </AppText>
              </View>
            ))}
          </View>
        ))}
        <View className="mt-10">
          <AppButton onPress={onStartWorkout} label="Start Workout" />
        </View>
      </PageContainer>
    </ScrollView>
  );
}
