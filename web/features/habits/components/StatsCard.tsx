"use client";

import { HabitStats } from "@/types/habit";
import { useTranslation } from "react-i18next";

type StatsCardProps = {
  stats: HabitStats;
};

export default function StatsCard({ stats }: StatsCardProps) {
  const { t } = useTranslation("habits");

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
        <p className="text-2xl text-green-400">{stats.current_streak}</p>
        <p className="text-sm font-body text-slate-400">
          {t("habits.stats.currentStreak")}
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
        <p className="text-2xl text-blue-400">{stats.longest_streak}</p>
        <p className="text-sm font-body text-slate-400">
          {t("habits.stats.longestStreak")}
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
        <p className="text-2xl text-yellow-400">
          {Math.round(stats.completion_rate)}%
        </p>
        <p className="text-sm font-body text-slate-400">
          {t("habits.stats.completionRate")}
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
        <p className="text-2xl text-slate-200">{stats.total}</p>
        <p className="text-sm font-body text-slate-400">
          {t("habits.stats.totalCompletions")}
        </p>
      </div>
    </div>
  );
}
