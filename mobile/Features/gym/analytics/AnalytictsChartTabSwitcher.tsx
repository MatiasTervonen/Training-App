import { useState } from "react";
import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import MuscleGroupChart from "@/Features/gym/analytics/MuscleGroupChart";
import MuscleGroupChartSets from "@/Features/gym/analytics/MuscleGroupChartSets";

type ChartTabSwitcherProps = {
  data: {
    total_sessions: number;
    avg_duration: number;
    muscle_groups: { group: string; count: number }[];
    sets_per_muscle_group: { group: string; count: number }[];
  };
};

export default function ChartTabSwitcher({ data }: ChartTabSwitcherProps) {
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
          textClassName={`text-center ${
            activeTab === "muscleGroups" ? "text-cyan-400" : "text-gray-100"
          }`}
          label="exercises"
        />

        <AnimatedButton
          onPress={() => setActiveTab("muscleGroupSets")}
          className={`px-4 py-2 w-[150px] rounded-xl ${
            activeTab === "muscleGroupSets" ? "bg-gray-800" : ""
          }`}
          textClassName={`text-center ${
            activeTab === "muscleGroupSets" ? "text-cyan-400" : "text-gray-100"
          }`}
          label="Sets"
        />
      </View>
      <View className="mb-2">
        {activeTab === "muscleGroups" && <MuscleGroupChart data={data.muscle_groups} />}
        {activeTab === "muscleGroupSets" && (
          <MuscleGroupChartSets data={data.sets_per_muscle_group} />
        )}
      </View>
    </>
  );
}