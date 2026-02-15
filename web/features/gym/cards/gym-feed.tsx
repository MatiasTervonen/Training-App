"use client";

import { Dumbbell, Timer } from "lucide-react";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type gymPayload = {
  duration: number;
  exercises_count: number;
  sets_count: number;
};

const formatDuration = (seconds: number) => {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default function GymCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as gymPayload;

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={
        <Dumbbell
          size={20}
          className={pinned ? "text-slate-900" : "text-slate-300"}
        />
      }
      typeName={t("feed.card.types.gym")}
      statsContent={
        <div
          className={`flex gap-4 ${pinned ? "text-slate-900" : "text-slate-300"}`}
        >
          {payload.exercises_count > 0 && (
            <p>
              {t("feed.card.exercises")}: {payload.exercises_count}
            </p>
          )}
          {payload.sets_count > 0 && (
            <p>
              {t("feed.card.sets")}: {payload.sets_count}
            </p>
          )}
          {payload.duration > 0 && (
            <div className="flex items-center gap-1 ">
              <Timer size={16} color={pinned ? "#0f172a" : "#cad5e2"} />
              <span className={pinned ? "text-slate-900" : "text-slate-300"}>
                {formatDuration(payload.duration)}
              </span>
            </div>
          )}
        </div>
      }
    />
  );
}
