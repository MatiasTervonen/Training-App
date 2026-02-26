import { View } from "react-native";
import { FullActivitySession } from "@/types/models";
import {
  formatDurationLong,
  formatMeters,
  formatAveragePace,
} from "@/lib/formatDate";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import StatCard from "@/components/StatCard";

type SessionStatsProps = {
  activity_session: FullActivitySession;
  hasRoute: boolean;
};

export default function SessionStats({ activity_session, hasRoute }: SessionStatsProps) {
  const { t } = useTranslation("activities");
  const stats = activity_session.stats;
  const session = activity_session.session;

  return (
    <LinearGradient
      colors={["#1e3a8a", "#0f172a", "#0f172a"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      className={`p-4 overflow-hidden shadow-md ${hasRoute ? "rounded-b-lg" : "rounded-lg mt-5"}`}
    >
      <View className="flex-row gap-2 mb-2">
        <StatCard
          label={t("activities.sessionStats.duration")}
          value={formatDurationLong(session.duration ?? 0)}
        />
        {hasRoute && (
          <StatCard
            label={t("activities.sessionStats.movingTime")}
            value={formatDurationLong(stats?.moving_time_seconds ?? 0)}
          />
        )}
        {hasRoute && (
          <StatCard
            label={t("activities.sessionStats.distance")}
            value={formatMeters(stats?.distance_meters ?? 0)}
          />
        )}
      </View>
      {hasRoute && (
        <View className="flex-row gap-2 mb-2">
          <StatCard
            label={t("activities.sessionStats.avgPace")}
            sublabel={t("activities.sessionStats.moving")}
            value={`${formatAveragePace(stats?.avg_pace ?? 0)} ${t("activities.sessionStats.minPerKm")}`}
          />
          <StatCard
            label={t("activities.sessionStats.avgSpeed")}
            value={`${stats?.avg_speed ?? 0} ${t("activities.sessionStats.kmPerHour")}`}
          />
        </View>
      )}
      <View className="flex-row gap-2">
        <StatCard
          label={t("activities.sessionStats.steps")}
          value={String(stats?.steps ?? 0)}
        />
        <StatCard
          label={t("activities.sessionStats.calories")}
          value={String(stats?.calories ?? 0)}
        />
      </View>
    </LinearGradient>
  );
}
