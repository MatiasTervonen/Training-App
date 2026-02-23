import { useMemo } from "react";
import { Dimensions, View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedBar from "@/features/gym/analytics/AnimatedBar";
import { useTranslation } from "react-i18next";

type sets_per_muscle_group = { group: string; count: number }[];

export default function MuscleGroupChartSets({
  data,
}: {
  data: sets_per_muscle_group;
}) {
  const { t } = useTranslation("gym");
  const screenWidth = Dimensions.get("window").width;

  const chartData = useMemo(() => {
    const entries = data.map(({ group, count }) => ({
      value: count,
      label: t(`gym.muscleGroups.${group}`),
    }));
    return entries.sort((a, b) => b.value - a.value);
  }, [data, t]);

  const maxValue = Math.max(...chartData.map((item) => item.value));

  const maxBarWidth = screenWidth * 0.7; // max width for bars

  return (
    <View className="gap-2 my-5 mx-4">
      {chartData.map((item, index) => {
        const barWidth = (item.value / maxValue) * maxBarWidth;

        return (
          <View key={index} className="flex-row items-center justify-between border-b border-slate-700/50">
            <View className="flex-row items-center flex-1">
              <View className="absolute z-50">
                <AppText className="pl-2">{item.label}</AppText>
              </View>

              <AnimatedBar
                targetWidth={barWidth}
                delay={index * 120}
                color="#3b82f6"
                style={{ height: 30 }}
              />
            </View>

            <AppText className="ml-2 min-w-[40px] text-right text-gray-300">{item.value}</AppText>
          </View>
        );
      })}
    </View>
  );
}
