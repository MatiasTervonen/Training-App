import { NotebookPen, FolderOpen, ImageIcon, Mic } from "lucide-react-native";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import BodyText from "@/components/BodyText";
import AppText from "@/components/AppText";
import { stripHtml } from "@/lib/stripHtml";

type notesPayload = {
  notes: string;
  folder_id?: string | null;
  folder_name?: string | null;
  "voice-count"?: number;
  "image-count"?: number;
};

type Props = FeedCardProps & {
  onMoveToFolder?: () => void;
  folderName?: string | null;
};

export default function NotesCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
  onMoveToFolder,
  folderName,
}: Props) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as notesPayload;
  const isHtmlNote = payload.notes?.startsWith("<");
  const voiceCount = payload["voice-count"] ?? 0;
  const imageCount = payload["image-count"] ?? 0;

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={isHtmlNote ? undefined : onEdit}
      onMoveToFolder={onMoveToFolder}
      typeIcon={
        <NotebookPen size={20} color={pinned ? "#0f172a" : "#cbd5e1"} />
      }
      typeName={t("feed.card.types.notes")}
      statsContent={
        <View>
          {folderName && (
            <View className="flex-row items-center gap-1 mb-1">
              <FolderOpen size={12} color="#94a3b8" />
              <AppText className="text-xs text-slate-400">{folderName}</AppText>
            </View>
          )}
          {(voiceCount > 0 || imageCount > 0) && (
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
            </View>
          )}
          {payload.notes && (
            <BodyText
              className={` ${pinned ? "text-slate-900" : "text-slate-300"}`}
              numberOfLines={2}
            >
              {stripHtml(payload.notes)}
            </BodyText>
          )}
        </View>
      }
      showUpdatedAt={true}
    />
  );
}
