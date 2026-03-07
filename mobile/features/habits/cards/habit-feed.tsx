import { Check, Repeat, Flame } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type HabitPayload = {
  completed: number;
  total: number;
  current_streak: number;
};

export default function HabitSummaryCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onHide,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const { t: tHabits } = useTranslation("habits");
  const payload = item.extra_fields as HabitPayload;
  const allDone = payload.completed === payload.total;

  return (
    <BaseFeedCard
      item={{ ...item, title: tHabits("title") }}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onHide={onHide}
      typeIcon={<Repeat size={20} color={pinned ? "#0f172a" : "#cbd5e1"} />}
      typeName={t("feed.card.types.habits")}
      statsContent={
        <View className="gap-1">
          <View className="flex-row gap-2 items-center">
            <AppText
              className={`${pinned ? "text-slate-900" : "text-slate-300"}`}
            >
              {t("feed.card.completed")}: {payload.completed} / {payload.total}
            </AppText>
            {allDone && <Check color="#22c55e" size={20} />}
          </View>
          {payload.current_streak > 0 && (
            <View className="flex-row gap-1 items-center">
              <Flame size={14} color="#f97316" />
              <AppText
                className={`text-sm ${pinned ? "text-slate-900" : "text-slate-400"}`}
              >
                {tHabits("feed.streak", { count: payload.current_streak })}
              </AppText>
            </View>
          )}
        </View>
      }
      showUpdatedAt={true}
    />
  );
}
