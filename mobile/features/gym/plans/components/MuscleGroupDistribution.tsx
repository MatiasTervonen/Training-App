import { View, Dimensions } from "react-native";
import { useMemo } from "react";
import BodyTextNC from "@/components/BodyTextNC";
import AppTextNC from "@/components/AppTextNC";
import { useTranslation } from "react-i18next";

const ALL_MUSCLE_GROUPS = [
  "chest", "quads", "hamstrings", "glutes", "lats", "upper_back",
  "front_delts", "side_delts", "rear_delts", "biceps", "triceps",
  "abs", "calves", "forearms", "traps", "lower_back",
];

type Exercise = {
  muscle_group: string | null;
};

type Props = {
  exercises: Exercise[];
};

export default function MuscleGroupDistribution({ exercises }: Props) {
  const { t } = useTranslation("gym");
  const screenWidth = Dimensions.get("window").width;

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    ALL_MUSCLE_GROUPS.forEach((g) => counts.set(g, 0));

    exercises.forEach((ex) => {
      const group = ex.muscle_group;
      if (!group) return;
      counts.set(group, (counts.get(group) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([group, count]) => ({
        group,
        label: t(`gym.muscleGroups.${group}`),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [exercises, t]);

  const maxValue = Math.max(...chartData.map((d) => d.count), 1);
  const maxBarWidth = screenWidth * 0.5;

  return (
    <View className="gap-1">
      <AppTextNC className="text-sm text-slate-400 mb-1">
        {t("gym.plans.muscleDistribution")}
      </AppTextNC>
      {chartData.map((item) => {
        const barWidth = item.count > 0 ? (item.count / maxValue) * maxBarWidth : 0;
        const isEmpty = item.count === 0;
        return (
          <View key={item.group} className="flex-row items-center gap-2">
            <BodyTextNC
              className={`text-xs w-24 ${isEmpty ? "text-slate-600" : "text-gray-200"}`}
              numberOfLines={1}
            >
              {item.label}
            </BodyTextNC>
            {item.count > 0 ? (
              <View
                className="h-4 bg-cyan-500/30 border border-cyan-500/50 rounded-sm"
                style={{ width: Math.max(barWidth, 8) }}
              />
            ) : (
              <View className="h-4 w-2 bg-slate-700/50 rounded-sm" />
            )}
            <AppTextNC className={`text-xs ${isEmpty ? "text-slate-600" : "text-slate-400"}`}>
              {item.count}
            </AppTextNC>
          </View>
        );
      })}
    </View>
  );
}
