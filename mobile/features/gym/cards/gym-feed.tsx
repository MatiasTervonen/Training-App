import { Dumbbell, Timer, ImageIcon, Mic, Video } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";
import BodyTextNC from "@/components/BodyTextNC";
import UploadProgressBadge from "@/features/feed-cards/UploadProgressBadge";

type gymPayload = {
  duration: number;
  exercises_count: number;
  sets_count: number;
  "image-count"?: number;
  "video-count"?: number;
  "voice-count"?: number;
};

export default function GymCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
  onHide,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as gymPayload;
  const imageCount = payload["image-count"] ?? 0;
  const videoCount = payload["video-count"] ?? 0;
  const voiceCount = payload["voice-count"] ?? 0;
  const hasMedia = voiceCount > 0 || imageCount > 0 || videoCount > 0;

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      onHide={onHide}
      typeIcon={<Dumbbell size={20} color={"#cbd5e1"} />}
      typeName={t("feed.card.types.gym")}
      statsContent={
        <View className="flex-row gap-6 items-center">
          {payload.exercises_count > 0 && payload.sets_count > 0 && (
            <View className="gap-4 flex-row items-center">
              <BodyTextNC className="text-slate-300">
                {t("feed.card.exercises")}: {payload.exercises_count}
              </BodyTextNC>
              <BodyTextNC className="text-slate-300">
                {t("feed.card.sets")}: {payload.sets_count}
              </BodyTextNC>
            </View>
          )}
          {payload.duration > 0 && (
            <View className="flex-row items-center gap-2">
              <Timer size={20} color={"#cbd5e1"} />
              <BodyTextNC className="text-slate-300">
                {Math.floor(payload.duration / 60)} {t("feed.card.min")}
              </BodyTextNC>
            </View>
          )}
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
      showUpdatedAt={true}
    />
  );
}
