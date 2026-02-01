import { NotebookPen } from "lucide-react-native";
import AppText from "@/components/AppText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/Features/feed-cards/BaseFeedCard";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

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

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={
        <NotebookPen size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
      }
      typeName={t("feed.card.types.notes")}
      statsContent={
        <View>
          {payload.notes && (
            <AppText
              className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
              numberOfLines={2}
            >
              {payload.notes}
            </AppText>
          )}
        </View>
      }
      showUpdatedAt={true}
    />
  );
}
