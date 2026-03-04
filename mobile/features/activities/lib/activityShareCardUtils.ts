import { ActivitySessionSummary } from "@/lib/stores/activitySessionSummaryStore";
import {
  formatDurationLong,
  formatMeters,
  formatAveragePace,
} from "@/lib/formatDate";
import { TFunction } from "i18next";

export type StatItem = {
  key: string;
  label: string;
  value: string;
};

export function getAvailableStats(
  summary: ActivitySessionSummary,
  t: TFunction,
): StatItem[] {
  const stats: StatItem[] = [];

  // Duration is always available
  stats.push({
    key: "duration",
    label: t("activities.share.duration"),
    value: formatDurationLong(summary.duration),
  });

  // Distance - only when GPS and distance > 0
  if (summary.distance && summary.distance > 0) {
    stats.push({
      key: "distance",
      label: t("activities.share.distance"),
      value: formatMeters(summary.distance),
    });
  }

  // Avg Pace - only when GPS and pace > 0
  if (summary.averagePace && summary.averagePace > 0) {
    stats.push({
      key: "avgPace",
      label: t("activities.share.avgPace"),
      value: `${formatAveragePace(summary.averagePace)} /km`,
    });
  }

  // Avg Speed - only when GPS and speed > 0
  if (summary.averageSpeed && summary.averageSpeed > 0) {
    stats.push({
      key: "avgSpeed",
      label: t("activities.share.avgSpeed"),
      value: `${summary.averageSpeed} km/h`,
    });
  }

  // Moving Time - only when GPS and movingTime > 0
  if (summary.movingTime && summary.movingTime > 0) {
    stats.push({
      key: "movingTime",
      label: t("activities.share.movingTime"),
      value: formatDurationLong(summary.movingTime),
    });
  }

  // Calories - always available
  if (summary.calories && summary.calories > 0) {
    stats.push({
      key: "calories",
      label: t("activities.share.calories"),
      value: String(summary.calories),
    });
  }

  // Steps - only when steps > 0
  if (summary.steps && summary.steps > 0) {
    stats.push({
      key: "steps",
      label: t("activities.share.steps"),
      value: String(summary.steps),
    });
  }

  return stats;
}

/**
 * Returns default selected stat keys. All available stats are selected by default.
 */
export function getDefaultSelectedKeys(available: StatItem[]): Set<string> {
  return new Set(available.map((s) => s.key));
}
