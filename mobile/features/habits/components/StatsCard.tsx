import { View } from "react-native";
import AppText from "@/components/AppText";
import { HabitStats } from "@/types/habit";
import { useTranslation } from "react-i18next";
import AppTextNC from "@/components/AppTextNC";

type StatsCardProps = {
  stats: HabitStats;
};

export default function StatsCard({ stats }: StatsCardProps) {
  const { t } = useTranslation("habits");

  return (
    <View className="flex-row flex-wrap gap-4 mb-4">
      <View className="flex-1 min-w-[140px] bg-slate-500/10 rounded-lg p-3 border border-slate-500/20">
        <AppTextNC className="text-gray-400 text-sm">
          {t("stats.currentStreak")}
        </AppTextNC>
        <AppTextNC className="text-2xl text-green-400">
          {stats.current_streak}{" "}
          <AppTextNC className="text-sm text-gray-400">
            {t("stats.days")}
          </AppTextNC>
        </AppTextNC>
      </View>
      <View className="flex-1 min-w-[140px] bg-slate-500/10 rounded-lg p-3 border border-slate-500/20">
        <AppTextNC className="text-gray-400 text-sm">
          {t("stats.longestStreak")}
        </AppTextNC>
        <AppTextNC className="text-2xl text-blue-400">
          {stats.longest_streak}{" "}
          <AppTextNC className="text-sm text-gray-400">
            {t("stats.days")}
          </AppTextNC>
        </AppTextNC>
      </View>
      <View className="flex-1 min-w-[140px] bg-slate-500/10 rounded-lg p-3 border border-slate-500/20">
        <AppTextNC className="text-gray-400 text-sm">
          {t("stats.completionRate")}
        </AppTextNC>
        <AppTextNC className="text-2xl text-yellow-400">
          {stats.completion_rate}%
        </AppTextNC>
      </View>
      <View className="flex-1 min-w-[140px] bg-slate-500/10 rounded-lg p-3 border border-slate-500/20">
        <AppTextNC className="text-gray-400 text-sm">
          {t("stats.totalCompletions")}
        </AppTextNC>
        <AppText className="text-2xl">{stats.total}</AppText>
      </View>
    </View>
  );
}
