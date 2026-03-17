import { formatDate } from "@/lib/formatDate";
import GroupTemplateExercise from "@/features/gym/lib/GroupTemplateExercises";
import { ScrollView, View } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { FullGymTemplate } from "@/database/gym/get-full-template";
import AnimatedButton from "@/components/buttons/animatedButton";

type Props = {
  item: FullGymTemplate;
  onStartWorkout: () => void;
};

export default function GymTemplate({ item, onStartWorkout }: Props) {
  const { t } = useTranslation("gym");
  const { t: tActivities } = useTranslation("activities");
  const groupedExercises = GroupTemplateExercise(
    item.gym_template_exercises || [],
  );

  const phases = item.gym_template_phases ?? [];
  const warmup = phases.find((p) => p.phase_type === "warmup");
  const cooldown = phases.find((p) => p.phase_type === "cooldown");

  const getTranslatedName = (name: string, slug: string | null) => {
    if (slug) {
      const translated = tActivities(
        `activities.activityNames.${slug}`,
        { defaultValue: "" },
      );
      if (translated && translated !== `activities.activityNames.${slug}`) {
        return translated;
      }
    }
    return name;
  };

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <PageContainer>
          <View className="mb-5 justify-center items-center">
            <AppText className="text-sm text-gray-300">
              {t("gym.templateView.created")} {formatDate(item.created_at)}
            </AppText>
            {item.updated_at && (
              <AppText className="text-sm text-slate-400 mt-2 text-center">
                {t("gym.templateView.updated")} {formatDate(item.updated_at)}
              </AppText>
            )}
            <AppText className="text-xl text-center mt-5">
              {item.name}
            </AppText>
          </View>
          {warmup?.activities && (
            <LinearGradient
              colors={["#065f46", "#0f172a", "#0f172a"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="mt-6 px-4 py-2 rounded-md overflow-hidden shadow-md border-2 border-emerald-700"
            >
              <AppText className="text-lg text-gray-100">
                {t("gym.phase.warmup")}: {getTranslatedName(warmup.activities.name, warmup.activities.slug)}
              </AppText>
            </LinearGradient>
          )}
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
                  {t("gym.gymForm.superSet")}
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
                      {t(
                        `gym.muscleGroups.${exercise.gym_exercises.muscle_group}`,
                      )}
                    </AppText>
                  </View>
                  <AppText className="text-gray-300 mt-2">
                    {t(`gym.equipment.${exercise.gym_exercises.equipment}`)}
                  </AppText>
                </View>
              ))}
            </LinearGradient>
          ))}
          {cooldown?.activities && (
            <LinearGradient
              colors={["#065f46", "#0f172a", "#0f172a"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="mt-6 px-4 py-2 rounded-md overflow-hidden shadow-md border-2 border-emerald-700"
            >
              <AppText className="text-lg text-gray-100">
                {t("gym.phase.cooldown")}: {getTranslatedName(cooldown.activities.name, cooldown.activities.slug)}
              </AppText>
            </LinearGradient>
          )}
        </PageContainer>
      </ScrollView>

      <View className="px-5 pb-5 pt-3 border-t border-gray-700">
        <AnimatedButton
          onPress={onStartWorkout}
          label={t("gym.templateView.startWorkout")}
          className="btn-base"
        />
      </View>
    </View>
  );
}
