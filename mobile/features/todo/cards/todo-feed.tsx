import { ListTodo, Check } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type todoPayload = {
  completed: number;
  total: number;
};

export default function TodoCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as todoPayload;

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<ListTodo size={20} color={pinned ? "#0f172a" : "#cbd5e1"} />}
      typeName={t("feed.card.types.todo")}
      statsContent={
        <>
          <View className="flex-row gap-2 items-center">
            <AppText
              className={`${pinned ? "text-slate-900" : "text-slate-300"}`}
            >
              {t("feed.card.completed")}: {payload.completed} / {payload.total}
            </AppText>
            {payload.completed === payload.total && <Check color="#22c55e" />}
          </View>
        </>
      }
      showUpdatedAt={true}
    />
  );
}
