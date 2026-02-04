import { Bell } from "lucide-react-native";
import { formatDateTime, formatNotifyTime } from "@/lib/formatDate";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type reminderPayload = {
  notify_date: string;
  notify_at: string;
  notify_at_time: string;
  weekdays: number[];
  seen_at: string;
  mode: "alarm" | "normal";
};

export default function LocalReminderCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as reminderPayload;

  const days = [
    t("feed.card.weekdays.sun"),
    t("feed.card.weekdays.mon"),
    t("feed.card.weekdays.tue"),
    t("feed.card.weekdays.wed"),
    t("feed.card.weekdays.thu"),
    t("feed.card.weekdays.fri"),
    t("feed.card.weekdays.sat"),
  ];

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
          <View className="flex-row items-center gap-2">
            <AppText
              className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              {payload.notify_at_time &&
                formatNotifyTime(payload.notify_at_time!)}
              {payload.notify_date && formatDateTime(payload.notify_date!)}
            </AppText>
            <Bell size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
          </View>
          {payload.weekdays && payload.weekdays.length > 0 && (
            <AppText
              className={`ml-4 ${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              {payload.weekdays.map((dayNum) => days[dayNum - 1]).join(", ")}
            </AppText>
          )}
        </>
      }
    />
  );
}
