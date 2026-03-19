import { Bell, Check } from "lucide-react-native";
import { View } from "react-native";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { formatDateTime } from "@/lib/formatDate";
import { useTranslation } from "react-i18next";
import BodyTextNC from "@/components/BodyTextNC";

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
  onHide,
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
      onHide={onHide}
      typeIcon={<Bell size={20} color={"#cbd5e1"} />}
      typeName={t("feed.card.types.reminder")}
      showUpdatedAt={true}
      statsContent={
        <>
          {payload.delivered && (
            <View className="flex-row items-center gap-2 bg-gray-900 rounded-md px-2">
              <Check size={30} color="#4ade80" />
              <BodyTextNC className="text-slate-300">
                {t("feed.card.delivered")}
              </BodyTextNC>
            </View>
          )}
          {payload.notify_at && (
            <View className="flex-row items-center gap-2">
              <BodyTextNC className="text-slate-300">
                {formatDateTime(payload.notify_at)}
              </BodyTextNC>
              <Bell size={20} color={"#cbd5e1"} />
            </View>
          )}
        </>
      }
    />
  );
}
