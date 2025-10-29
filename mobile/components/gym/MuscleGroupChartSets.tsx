import { full_gym_session } from "../../types/models";
import { useMemo } from "react";
import { Dimensions, View } from "react-native";
import AppText from "../AppText";
import AnimatedBar from "./AnimatedBar";

export default function MuscleGroupChartSets({
  data,
}: {
  data: full_gym_session[];
}) {
  const screenWidth = Dimensions.get("window").width;

  function muscle_groupDataSets(data: full_gym_session[]) {
    const muscleGroupSetCount: { [key: string]: number } = {};
    data.forEach((session) => {
      session.gym_session_exercises.forEach((exercise) => {
        const name = exercise.gym_exercises.muscle_group;

        exercise.gym_sets.forEach(() => {
          muscleGroupSetCount[name] = (muscleGroupSetCount[name] || 0) + 1;
        });
      });
    });
    return muscleGroupSetCount;
  }

  const chartData = useMemo(() => {
    const entries = Object.entries(muscle_groupDataSets(data)).map(
      ([name, value]) => ({
        value,
        label: name,
      })
    );
    return entries.sort((a, b) => b.value - a.value);
  }, [data]);

  const maxValue = Math.max(...chartData.map((item) => item.value));

  const maxBarWidth = screenWidth * 0.8; // max width for bars

  return (
    <View className="gap-2 my-5 ml-4">
      {chartData.map((item, index) => {
        const barWidth = (item.value / maxValue) * maxBarWidth;

        return (
          <View key={index} className="flex-row items-center gap-5">
            <View className="absolute z-50 ">
              <AppText className="pl-2">{item.label}</AppText>
            </View>

            <AnimatedBar
              targetWidth={barWidth}
              delay={index * 120}
              color="#3b82f6"
              style={{ height: 30 }}
            />
            <AppText>{item.value}</AppText>
          </View>
        );
      })}
    </View>
  );
}
