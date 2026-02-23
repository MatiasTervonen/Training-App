import { useState } from "react";
import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppText from "@/components/AppTextNC";
import MuscleGroupChart from "@/features/gym/analytics/MuscleGroupChart";
import MuscleGroupChartSets from "@/features/gym/analytics/MuscleGroupChartSets";
import { useTranslation } from "react-i18next";

type ChartTabSwitcherProps = {
  data: {
    total_sessions: number;
    avg_duration: number;
    muscle_groups: { group: string; count: number }[];
    sets_per_muscle_group: { group: string; count: number }[];
  };
};

export default function ChartTabSwitcher({ data }: ChartTabSwitcherProps) {
  const { t } = useTranslation("gym");
  const [activeTab, setActiveTab] = useState<
    "muscleGroups" | "muscleGroupSets"
  >("muscleGroups");

  return (
    <>
      <View className="flex-row items-center justify-center gap-4 mb-2">
        <AnimatedButton
          onPress={() => setActiveTab("muscleGroups")}
          className={`px-4 py-2 w-[150px] rounded-xl ${
            activeTab === "muscleGroups" ? "bg-gray-800" : ""
          }`}
        >
          <AppText
            className={`text-center text-lg ${
              activeTab === "muscleGroups" ? "text-cyan-400" : "text-gray-100"
            }`}
          >
            {t("gym.analytics.tabs.exercises")}
          </AppText>
        </AnimatedButton>

        <AnimatedButton
          onPress={() => setActiveTab("muscleGroupSets")}
          className={`px-4 py-2 w-[150px] rounded-xl ${
            activeTab === "muscleGroupSets" ? "bg-gray-800" : ""
          }`}
        >
          <AppText
            className={`text-center text-lg ${
              activeTab === "muscleGroupSets"
                ? "text-cyan-400"
                : "text-gray-100"
            }`}
          >
            {t("gym.analytics.tabs.sets")}
          </AppText>
        </AnimatedButton>
      </View>
      <View className="mb-2">
        {activeTab === "muscleGroups" && (
          <MuscleGroupChart data={data.muscle_groups} />
        )}
        {activeTab === "muscleGroupSets" && (
          <MuscleGroupChartSets data={data.sets_per_muscle_group} />
        )}
      </View>
    </>
  );
}
