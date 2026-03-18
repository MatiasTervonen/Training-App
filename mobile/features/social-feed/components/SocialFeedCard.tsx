import { View } from "react-native";
import AppText from "@/components/AppText";
import SocialFeedCardHeader from "@/features/social-feed/components/SocialFeedCardHeader";
import SocialFeedCardFooter from "@/features/social-feed/components/SocialFeedCardFooter";
import { SocialFeedItem } from "@/types/social-feed";
import { Dumbbell, Activity, Mic, ImageIcon, Video } from "lucide-react-native";
import { formatMeters, formatDuration } from "@/lib/formatDate";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  item: SocialFeedItem;
  onToggleLike: () => void;
  onExpand: () => void;
  onOpenComments: () => void;
};

function GymStats({ item }: { item: SocialFeedItem }) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as {
    duration: number;
    exercises_count: number;
    sets_count: number;
    "image-count"?: number;
    "video-count"?: number;
    "voice-count"?: number;
  };
  const imageCount = payload["image-count"] ?? 0;
  const videoCount = payload["video-count"] ?? 0;
  const voiceCount = payload["voice-count"] ?? 0;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-5">
        {payload.exercises_count > 0 && (
          <View className="items-center">
            <AppText className="text-lg">{payload.exercises_count}</AppText>
            <AppText className="text-xs text-slate-400">{t("feed.card.exercises")}</AppText>
          </View>
        )}
        {payload.sets_count > 0 && (
          <View className="items-center">
            <AppText className="text-lg">{payload.sets_count}</AppText>
            <AppText className="text-xs text-slate-400">{t("feed.card.sets")}</AppText>
          </View>
        )}
        {payload.duration > 0 && (
          <View className="items-center">
            <AppText className="text-lg">
              {Math.floor(payload.duration / 60)}
            </AppText>
            <AppText className="text-xs text-slate-400">{t("feed.card.min")}</AppText>
          </View>
        )}
      </View>
      {(voiceCount > 0 || imageCount > 0 || videoCount > 0) && (
        <View className="flex-row items-center gap-3">
          {voiceCount > 0 && (
            <View className="flex-row items-center gap-1">
              <Mic size={12} color="#94a3b8" />
              <AppText className="text-xs text-slate-400">{voiceCount}</AppText>
            </View>
          )}
          {imageCount > 0 && (
            <View className="flex-row items-center gap-1">
              <ImageIcon size={12} color="#94a3b8" />
              <AppText className="text-xs text-slate-400">{imageCount}</AppText>
            </View>
          )}
          {videoCount > 0 && (
            <View className="flex-row items-center gap-1">
              <Video size={12} color="#94a3b8" />
              <AppText className="text-xs text-slate-400">{videoCount}</AppText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function ActivityStats({ item }: { item: SocialFeedItem }) {
  const { t } = useTranslation("activities");
  const payload = item.extra_fields as {
    duration: number;
    distance: number;
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-5">
        {payload.distance > 0 && (
          <View className="items-center">
            <AppText className="text-lg">{formatMeters(payload.distance)}</AppText>
            <AppText className="text-xs text-slate-400">{t("activities.sessionStats.distance")}</AppText>
          </View>
        )}
        <View className="items-center">
          <AppText className="text-lg">{formatDuration(payload.duration)}</AppText>
          <AppText className="text-xs text-slate-400">{t("activities.sessionStats.duration")}</AppText>
        </View>
      </View>
    </View>
  );
}

function getTypeIcon(type: string) {
  switch (type) {
    case "gym_sessions":
      return <Dumbbell size={14} color="#94a3b8" />;
    case "activity_sessions":
      return <Activity size={14} color="#94a3b8" />;
    default:
      return null;
  }
}

function getTypeName(type: string, t: (key: string) => string) {
  switch (type) {
    case "gym_sessions":
      return t("feed.card.types.gym");
    case "activity_sessions":
      return t("feed.card.types.activity");
    default:
      return "";
  }
}

function getActivityTypeName(item: SocialFeedItem, t: (key: string, options?: Record<string, string>) => string) {
  const payload = item.extra_fields as { activity_name: string; activity_slug?: string };
  if (payload.activity_slug) {
    const translated = t(`activities.activityNames.${payload.activity_slug}`, { defaultValue: "" });
    if (translated && translated !== `activities.activityNames.${payload.activity_slug}`) {
      return translated;
    }
  }
  return payload.activity_name;
}

export default function SocialFeedCard({ item, onToggleLike, onExpand, onOpenComments }: Props) {
  const { t } = useTranslation("feed");
  const { t: tActivities } = useTranslation("activities");

  const typeName = item.type === "activity_sessions"
    ? getActivityTypeName(item, tActivities)
    : getTypeName(item.type, t);

  const typeIcon = (
    <View className="flex-row items-center gap-1.5">
      {getTypeIcon(item.type)}
      <AppText className="text-slate-400 text-xs">{typeName}</AppText>
    </View>
  );

  const gradientColors: [string, string] = item.type === "gym_sessions"
    ? ["rgba(59,130,246,0.12)", "rgba(59,130,246,0.03)"]
    : ["rgba(34,197,94,0.12)", "rgba(34,197,94,0.03)"];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="border border-slate-700 rounded-md mx-4 my-2 overflow-hidden"
    >
      {/* Author header with type badge */}
      <SocialFeedCardHeader item={item} typeIcon={typeIcon} />

      {/* Title */}
      <View className="px-4 pb-2">
        <AppText className="text-lg" numberOfLines={1} ellipsizeMode="tail">
          {item.title}
        </AppText>
      </View>

      {/* Stats content */}
      <View className="px-4 pb-3">
        {item.type === "gym_sessions" && <GymStats item={item} />}
        {item.type === "activity_sessions" && <ActivityStats item={item} />}
      </View>

      {/* Footer with like & details */}
      <SocialFeedCardFooter item={item} onToggleLike={onToggleLike} onExpand={onExpand} onOpenComments={onOpenComments} />
    </LinearGradient>
  );
}
