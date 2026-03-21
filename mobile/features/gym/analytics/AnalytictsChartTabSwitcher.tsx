import { useState } from "react";
import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import MuscleGroupChart from "@/features/gym/analytics/MuscleGroupChart";
import MuscleGroupChartSets from "@/features/gym/analytics/MuscleGroupChartSets";
import { useTranslation } from "react-i18next";
import AppTextNC from "@/components/AppTextNC";

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
          className={`w-[150px] rounded-md ${
            activeTab === "muscleGroups"
              ? "bg-blue-500/20 border border-blue-500/40 px-4 py-2 shadow-md"
              : "bg-gray-500/20 border border-gray-500/40 px-4 py-2 shadow-md"
          }`}
        >
          <AppTextNC
            className={`text-center text-lg ${
              activeTab === "muscleGroups" ? "text-blue-400" : "text-gray-400"
            }`}
          >
            {t("gym.analytics.tabs.exercises")}
          </AppTextNC>
        </AnimatedButton>

        <AnimatedButton
          onPress={() => setActiveTab("muscleGroupSets")}
          className={`w-[150px] rounded-md ${
            activeTab === "muscleGroupSets"
              ? "bg-blue-500/20 border border-blue-500/40 px-4 py-2 shadow-md"
              : "bg-gray-500/20 border border-gray-500/40 px-4 py-2 shadow-md"
          }`}
        >
          <AppTextNC
            className={`text-center text-lg ${
              activeTab === "muscleGroupSets" ? "text-blue-400" : "text-gray-400"
            }`}
          >
            {t("gym.analytics.tabs.sets")}
          </AppTextNC>
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
