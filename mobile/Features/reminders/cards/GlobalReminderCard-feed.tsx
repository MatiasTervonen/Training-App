import { Bell, Check } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { formatDateTime } from "@/lib/formatDate";
import { useTranslation } from "react-i18next";

type reminderPayload = {
  notify_at: string;
  delivered: boolean;
};

export default function GlobalReminderCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as reminderPayload;

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<Bell size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />}
      typeName={t("feed.card.types.reminder")}
      showUpdatedAt={true}
      statsContent={
        <>
          {payload.delivered && (
            <View className="flex-row items-center gap-2 bg-gray-900 rounded-md px-2">
              <Check size={30} color="#4ade80" />
              <AppText className="text-gray-100">
                {t("feed.card.delivered")}
              </AppText>
            </View>
          )}
          {payload.notify_at && (
            <View className="flex-row items-center gap-2">
              <AppText
                className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
              >
                {formatDateTime(payload.notify_at)}
              </AppText>
              <Bell size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
            </View>
          )}
        </>
      }
    />
  );
}
