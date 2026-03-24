import { Activity, Route, Timer, Mic, ImageIcon, Video } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { formatMeters, formatDuration } from "@/lib/formatDate";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";
import UploadProgressBadge from "@/features/feed-cards/UploadProgressBadge";

type activityPayload = {
  duration: number;
  distance: number;
  activity_name: string;
  activity_slug?: string;
  "voice-count"?: number;
  "image-count"?: number;
  "video-count"?: number;
};
export default function ActivityCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
  onHide,
}: FeedCardProps) {
  const { t } = useTranslation("activities");
  const payload = item.extra_fields as activityPayload;
  const voiceCount = payload["voice-count"] ?? 0;
  const imageCount = payload["image-count"] ?? 0;
  const videoCount = payload["video-count"] ?? 0;
  const hasMedia = voiceCount > 0 || imageCount > 0 || videoCount > 0;

  // Get translated activity name using slug, fallback to stored name
  const getActivityTypeName = () => {
    if (payload.activity_slug) {
      const translated = t(
        `activities.activityNames.${payload.activity_slug}`,
        {
          defaultValue: "",
        },
      );
      if (
        translated &&
        translated !== `activities.activityNames.${payload.activity_slug}`
      ) {
        return translated;
      }
    }
    return payload.activity_name;
  };

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      onHide={onHide}
      typeIcon={<Activity size={20} color={"#cbd5e1"} />}
      typeName={getActivityTypeName()}
      statsContent={
        <View className="flex-row items-center gap-5">
          {payload.distance > 0 && (
            <View className="flex-row items-center gap-2">
              <Route size={20} color={"#cbd5e1"} />
              <BodyText>
                {formatMeters(payload.distance)}
              </BodyText>
            </View>
          )}
          <View className="flex-row items-center gap-2">
            <Timer size={20} color={"#cbd5e1"} />
            <BodyText>
              {formatDuration(payload.duration)}
            </BodyText>
          </View>
        </View>
      }
      mediaContent={
        hasMedia ? (
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
            <UploadProgressBadge targetId={item.source_id} />
          </View>
        ) : (
          <UploadProgressBadge targetId={item.source_id} />
        )
      }
    />
  );
}
