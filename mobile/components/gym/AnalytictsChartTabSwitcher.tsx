import { full_gym_session } from "../../types/models";
import { useState } from "react";
import { View } from "react-native";
import AnimatedButton from "../animatedButton";
import MuscleGroupChart from "./MuscleGroupChart";
import MuscleGroupChartSets from "./MuscleGroupChartSets";

export default function ChartTabSwitcher({
  data,
}: {
  data: full_gym_session[];
}) {
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
            activeTab === "muscleGroups" ? "text-cyan-500" : ""
          }`}
          label="exercises"
        />

        <AnimatedButton
          onPress={() => setActiveTab("muscleGroupSets")}
          className={`px-4 py-2 w-[150px] rounded-xl ${
            activeTab === "muscleGroupSets" ? "bg-gray-800" : ""
          }`}
          textClassName={`text-center ${
            activeTab === "muscleGroupSets" ? "text-cyan-500" : ""
          }`}
          label="Sets"
        />
      </View>
      <View className="mb-2">
        {activeTab === "muscleGroups" && <MuscleGroupChart data={data} />}
        {activeTab === "muscleGroupSets" && (
          <MuscleGroupChartSets data={data} />
        )}
      </View>
    </>
  );
}
