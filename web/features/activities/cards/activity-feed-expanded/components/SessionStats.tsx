"use client";

import { FullActivitySession } from "@/types/models";
import {
  formatDurationLong,
  formatMeters,
  formatAveragePace,
} from "@/lib/formatDate";
import { useTranslation } from "react-i18next";
import { StatCard } from "@/components/StatCard";

type SessionStatsProps = {
  activity_session: FullActivitySession;
};

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
