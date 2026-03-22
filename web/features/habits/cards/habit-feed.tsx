"use client";

import { Check, Repeat, Flame } from "lucide-react";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type HabitPayload = {
  completed: number;
  total: number;
  current_streak: number;
};

export default function HabitCard({
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
      item={{ ...item, title: tHabits("habits.title") }}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onHide={onHide}
      typeIcon={<Repeat size={20} className="text-slate-300" />}
      typeName={t("feed.card.types.habits")}
      statsContent={
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-body text-slate-300">
              {t("feed.card.completed")}: {payload.completed} / {payload.total}
            </span>
            {allDone && <Check color="#22c55e" size={20} />}
          </div>
          {payload.current_streak > 0 && (
            <div className="flex items-center gap-1">
              <Flame size={14} color="#f97316" />
              <span className="font-body text-sm text-slate-400">
                {tHabits("habits.feed.streak", { count: payload.current_streak })}
              </span>
            </div>
          )}
        </div>
      }
      showUpdatedAt={true}
    />
  );
}
