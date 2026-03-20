import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Dumbbell, Activity, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import { formatDuration, formatMeters, formatAveragePace } from "@/lib/formatDate";
import { SessionShareContent } from "@/types/chat";

type ChatSessionCardProps = {
  data: SessionShareContent;
};

function GymCardStats({ stats }: { stats: Record<string, number> }) {
  const { t } = useTranslation("chat");

  return (
    <View className="flex-row items-center gap-4">
      {stats.duration > 0 && (
        <View className="items-center">
          <BodyText className="text-base">{formatDuration(stats.duration)}</BodyText>
          <BodyTextNC className="text-[10px] text-slate-400">
            {t("chat.sessionCard.duration")}
          </BodyTextNC>
        </View>
      )}
      {stats.exercises_count > 0 && (
        <View className="items-center">
          <BodyText className="text-base">{stats.exercises_count}</BodyText>
          <BodyTextNC className="text-[10px] text-slate-400">
            {t("chat.sessionCard.exercises")}
          </BodyTextNC>
        </View>
      )}
      {stats.sets_count > 0 && (
        <View className="items-center">
          <BodyText className="text-base">{stats.sets_count}</BodyText>
          <BodyTextNC className="text-[10px] text-slate-400">
            {t("chat.sessionCard.sets")}
          </BodyTextNC>
        </View>
      )}
      {(stats.total_volume ?? 0) > 0 && (
        <View className="items-center">
          <BodyText className="text-base">{Math.round(stats.total_volume)}</BodyText>
          <BodyTextNC className="text-[10px] text-slate-400">
            {t("chat.sessionCard.volume")}
          </BodyTextNC>
        </View>
      )}
    </View>
  );
}

function ActivityCardStats({ stats }: { stats: Record<string, number> }) {
  const { t } = useTranslation("chat");
  const shownStats: { label: string; value: string }[] = [];

  if (stats.duration > 0) {
    shownStats.push({
      label: t("chat.sessionCard.duration"),
      value: formatDuration(stats.duration),
    });
  }
  if (stats.distance_meters > 0) {
    shownStats.push({
      label: t("chat.sessionCard.distance"),
      value: formatMeters(stats.distance_meters),
    });
  }
  if (stats.avg_pace > 0) {
    shownStats.push({
      label: t("chat.sessionCard.pace"),
      value: formatAveragePace(stats.avg_pace),
    });
  }
  if (stats.calories > 0) {
    shownStats.push({
      label: t("chat.sessionCard.calories"),
      value: `${Math.round(stats.calories)}`,
    });
  }

  return (
    <View className="flex-row items-center gap-4">
      {shownStats.slice(0, 4).map((stat) => (
        <View key={stat.label} className="items-center">
          <BodyText className="text-base">{stat.value}</BodyText>
          <BodyTextNC className="text-[10px] text-slate-400">{stat.label}</BodyTextNC>
        </View>
      ))}
    </View>
  );
}

export default function ChatSessionCard({ data }: ChatSessionCardProps) {
  const { t } = useTranslation("chat");
  const isGym = data.session_type === "gym_sessions";

  const gradientColors: [string, string] = isGym
    ? ["rgba(59,130,246,0.15)", "rgba(59,130,246,0.05)"]
    : ["rgba(34,197,94,0.15)", "rgba(34,197,94,0.05)"];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-xl overflow-hidden border border-slate-600/50"
      style={{ width: 300 }}
    >
      <View className="px-4 pt-3.5 pb-3">
        <View className="flex-row items-center gap-2 mb-2.5">
          {isGym ? (
            <Dumbbell size={16} color="#94a3b8" />
          ) : (
            <Activity size={16} color="#94a3b8" />
          )}
          <BodyTextNC className="text-sm text-slate-400">
            {isGym
              ? t("chat.sessionCard.gymSession")
              : data.activity_name ?? t("chat.sessionCard.activitySession")}
          </BodyTextNC>
        </View>

        <AppText className="text-lg mb-3" numberOfLines={1}>
          {data.title}
        </AppText>

        {isGym ? (
          <GymCardStats stats={data.stats} />
        ) : (
          <ActivityCardStats stats={data.stats} />
        )}

        <View className="flex-row items-center justify-start mt-2.5 gap-0.5">
          <BodyTextNC className="text-xs text-slate-500">
            {t("chat.sessionCard.tapToView")}
          </BodyTextNC>
          <ChevronRight size={13} color="#64748b" />
        </View>
      </View>
    </LinearGradient>
  );
}
