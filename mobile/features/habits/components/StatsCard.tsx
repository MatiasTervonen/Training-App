import { View } from "react-native";
import AppText from "@/components/AppText";
import { HabitStats } from "@/types/habit";
import { useTranslation } from "react-i18next";

type StatsCardProps = {
  stats: HabitStats;
};

export default function StatsCard({ stats }: StatsCardProps) {
  const { t } = useTranslation("habits");

  return (
    <View className="flex-row flex-wrap gap-4 mb-4">
      <View className="flex-1 min-w-[140px] bg-slate-500/10 rounded-lg p-3 border border-slate-500/20">
        <AppText className="text-gray-400 text-sm">{t("stats.currentStreak")}</AppText>
        <AppText className="text-2xl text-green-400">
          {stats.current_streak} <AppText className="text-sm text-gray-400">{t("stats.days")}</AppText>
        </AppText>
      </View>
      <View className="flex-1 min-w-[140px] bg-slate-500/10 rounded-lg p-3 border border-slate-500/20">
        <AppText className="text-gray-400 text-sm">{t("stats.longestStreak")}</AppText>
        <AppText className="text-2xl text-blue-400">
          {stats.longest_streak} <AppText className="text-sm text-gray-400">{t("stats.days")}</AppText>
        </AppText>
      </View>
      <View className="flex-1 min-w-[140px] bg-slate-500/10 rounded-lg p-3 border border-slate-500/20">
        <AppText className="text-gray-400 text-sm">{t("stats.completionRate")}</AppText>
        <AppText className="text-2xl text-yellow-400">{stats.completion_rate}%</AppText>
      </View>
      <View className="flex-1 min-w-[140px] bg-slate-500/10 rounded-lg p-3 border border-slate-500/20">
        <AppText className="text-gray-400 text-sm">{t("stats.totalCompletions")}</AppText>
        <AppText className="text-2xl text-gray-100">{stats.total}</AppText>
      </View>
    </View>
  );
}
