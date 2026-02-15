import { NotebookPen } from "lucide-react-native";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import BodyText from "@/components/BodyText";
import { stripHtml } from "@/lib/stripHtml";

type notesPayload = {
  notes: string;
};

export default function NotesCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as notesPayload;
  const isHtmlNote = payload.notes?.startsWith("<");

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={isHtmlNote ? undefined : onEdit}
      typeIcon={
        <NotebookPen size={20} color={pinned ? "#0f172a" : "#cbd5e1"} />
      }
      typeName={t("feed.card.types.notes")}
      statsContent={
        <View>
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
