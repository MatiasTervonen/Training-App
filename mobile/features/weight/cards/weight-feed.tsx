import { Scale, Mic, ImageIcon, Video } from "lucide-react-native";
import AppText from "@/components/AppText";
import { useUserStore } from "@/lib/stores/useUserStore";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type weightPayload = {
  weight: number;
  "image-count"?: number;
  "video-count"?: number;
  "voice-count"?: number;
};

export default function WeightCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
  onHide,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as weightPayload;
  const voiceCount = payload["voice-count"] ?? 0;
  const imageCount = payload["image-count"] ?? 0;
  const videoCount = payload["video-count"] ?? 0;

  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      onHide={onHide}
      typeIcon={<Scale size={20} color={"#cbd5e1"} />}
      typeName={t("feed.card.types.weight")}
      statsContent={
        <View>
          {(voiceCount > 0 || imageCount > 0 || videoCount > 0) && (
            <View className="flex-row items-center gap-3 mb-1">
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
          <AppText
            className={` ${"text-slate-300"}`}
          >
            {payload.weight} {weightUnit}
          </AppText>
          <AppText>{" "}</AppText>
        </View>
      }
    />
  );
}
