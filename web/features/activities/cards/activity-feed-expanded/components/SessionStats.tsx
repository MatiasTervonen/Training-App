"use client";

import { FullActivitySession } from "@/types/models";
import {
  formatDurationLong,
  formatMeters,
  formatAveragePace,
} from "@/lib/formatDate";
import { useTranslation } from "react-i18next";

type SessionStatsProps = {
  activity_session: FullActivitySession;
};

type StatCardProps = {
  label: string;
  sublabel?: string;
  value: string;
};

function StatCard({ label, sublabel, value }: StatCardProps) {
  return (
    <div className="flex-1 min-w-[30%] flex flex-col items-center justify-between gap-1 border border-blue-500 py-3 px-2 rounded-lg bg-slate-950/50">
      <div className="flex items-center justify-center gap-1">
        <span className="text-gray-300 text-sm truncate">{label}</span>
        {sublabel && <span className="text-gray-500 text-xs">{sublabel}</span>}
      </div>
      <span className="text-gray-100 text-base text-center">{value}</span>
    </div>
  );
}

export default function SessionStats({ activity_session }: SessionStatsProps) {
  const { t } = useTranslation("activities");
  const stats = activity_session.stats;
  const session = activity_session.session;

  return (
    <div className="bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 p-4 rounded-b-lg shadow-md">
      <div className="flex gap-2 mb-2">
        <StatCard
          label={t("activities.sessionStats.duration")}
          value={formatDurationLong(session.duration ?? 0)}
        />
        <StatCard
          label={t("activities.sessionStats.movingTime")}
          value={formatDurationLong(stats?.moving_time_seconds ?? 0)}
        />
        <StatCard
          label={t("activities.sessionStats.distance")}
          value={formatMeters(stats?.distance_meters ?? 0)}
        />
      </div>
      <div className="flex gap-2 mb-2">
        <StatCard
          label={t("activities.sessionStats.avgPace")}
          sublabel={t("activities.sessionStats.moving")}
          value={`${formatAveragePace(stats?.avg_pace ?? 0)} ${t("activities.sessionStats.minPerKm")}`}
        />
        <StatCard
          label={t("activities.sessionStats.avgSpeed")}
          value={`${stats?.avg_speed ?? 0} ${t("activities.sessionStats.kmPerHour")}`}
        />
      </div>
      <div className="flex gap-2">
        <StatCard
          label={t("activities.sessionStats.steps")}
          value={String(stats?.steps ?? 0)}
        />
        <StatCard
          label={t("activities.sessionStats.calories")}
          value={String(stats?.calories ?? 0)}
        />
      </div>
    </div>
  );
}
