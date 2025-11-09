import { full_gym_session } from "../../types/models";
import { Dimensions, View } from "react-native";
import { useMemo } from "react";
import AppText from "../AppText";
import AnimatedBar from "./AnimatedBar";

export default function MuscleGroupChart({
  data,
}: {
  data: full_gym_session[];
}) {
  const screenWidth = Dimensions.get("window").width;

  function muscle_groupData(data: full_gym_session[]) {
    const muscleGroupCount: { [key: string]: number } = {};
    data.forEach((session) => {
      session.gym_session_exercises.forEach((exercise) => {
        const group = exercise.gym_exercises;
        const name = group.muscle_group;
        if (muscleGroupCount[name]) {
          muscleGroupCount[name] += 1;
        } else {
          muscleGroupCount[name] = 1;
        }
      });
    });
    return muscleGroupCount;
  }

  const chartData = useMemo(() => {
    const entries = Object.entries(muscle_groupData(data)).map(
      ([name, value]) => ({
        value,
        label: name,
      })
    );
    return entries.sort((a, b) => b.value - a.value);
  }, [data]);

  const maxValue = Math.max(...chartData.map((item) => item.value));

  const maxBarWidth = screenWidth * 0.8; // max width for bars
  const minLabelSpace = 90;

  return (
    <View className="gap-2 my-5 ml-4">
      {chartData.map((item, index) => {
        const barWidth = (item.value / maxValue) * maxBarWidth;

        const valueLeft = Math.max(barWidth + 8, minLabelSpace + 8);

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

            <View className="absolute" style={{ left: valueLeft }}>
              <AppText>{item.value}</AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}
