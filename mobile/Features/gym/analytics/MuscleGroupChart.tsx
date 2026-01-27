import { Dimensions, View } from "react-native";
import { useMemo } from "react";
import AppText from "@/components/AppText";
import AnimatedBar from "@/Features/gym/analytics/AnimatedBar";

type muscle_groups = { group: string; count: number }[];

export default function MuscleGroupChart({ data }: { data: muscle_groups }) {
  const screenWidth = Dimensions.get("window").width;

  const chartData = useMemo(() => {
    const entries = (data).map(({ group, count }) => ({
      value: count,
      label: group,
    }));
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
