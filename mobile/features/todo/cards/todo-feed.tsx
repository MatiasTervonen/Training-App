import { ListTodo, Check, Mic, ImageIcon, Video } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type todoPayload = {
  completed: number;
  total: number;
  "voice-count"?: number;
  "image-count"?: number;
  "video-count"?: number;
};

export default function TodoCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
  onHide,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as todoPayload;
  const voiceCount = payload["voice-count"] ?? 0;
  const imageCount = payload["image-count"] ?? 0;
  const videoCount = payload["video-count"] ?? 0;

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      onHide={onHide}
      typeIcon={<ListTodo size={20} color={pinned ? "#0f172a" : "#cbd5e1"} />}
      typeName={t("feed.card.types.todo")}
      statsContent={
        <View>
          {(voiceCount > 0 || imageCount > 0 || videoCount > 0) && (
            <View className="flex-row items-center gap-3 mb-1">
              {voiceCount > 0 && (
                <View className="flex-row items-center gap-1">
                  <Mic size={12} color="#94a3b8" />
                  <AppText className="text-xs text-slate-400">
                    {voiceCount}
                  </AppText>
                </View>
              )}
              {imageCount > 0 && (
                <View className="flex-row items-center gap-1">
                  <ImageIcon size={12} color="#94a3b8" />
                  <AppText className="text-xs text-slate-400">
                    {imageCount}
                  </AppText>
                </View>
              )}
              {videoCount > 0 && (
                <View className="flex-row items-center gap-1">
                  <Video size={12} color="#94a3b8" />
                  <AppText className="text-xs text-slate-400">
                    {videoCount}
                  </AppText>
                </View>
              )}
            </View>
          )}
          <View className="flex-row gap-2 items-center">
            <AppText
              className={`${pinned ? "text-slate-900" : "text-slate-300"}`}
            >
              {t("feed.card.completed")}: {payload.completed} / {payload.total}
            </AppText>
            {payload.completed === payload.total && <Check color="#22c55e" />}
          </View>
        </View>
      }
      showUpdatedAt={true}
    />
  );
}
