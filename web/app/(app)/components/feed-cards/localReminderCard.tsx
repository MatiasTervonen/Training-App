"use client";

import { Bell, Check } from "lucide-react";
import { formatDateTime, formatNotifyTime } from "@/app/(app)/lib/formatDate";
import { FeedCardProps } from "@/app/(app)/types/session";
import BaseFeedCard from "./BaseFeedCard";
import { useTranslation } from "react-i18next";

type reminderPayload = {
  notify_date: string;
  notify_at: string;
  notify_at_time: string;
  weekdays: number[];
  seen_at: string;
  delivered: boolean;
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
      typeIcon={<Bell size={20} className={pinned ? "text-slate-900" : "text-gray-100"} />}
      typeName={t("feed.card.types.reminder")}
      showUpdatedAt={!payload.delivered}
      statsContent={
        <div className={`flex flex-col gap-2 ${pinned ? "text-slate-900" : "text-gray-100"}`}>
          <div className="flex items-center gap-2">
            <p>
              {payload.notify_at_time
                ? formatNotifyTime(payload.notify_at_time)
                : formatDateTime(payload.notify_date)}
            </p>
            {payload.seen_at ? (
              <Check size={24} className="text-green-400" />
            ) : (
              <Bell size={20} />
            )}
          </div>
          {payload.weekdays &&
            Array.isArray(payload.weekdays) &&
            payload.weekdays.length > 0 && (
              <p>
                {payload.weekdays
                  .map((dayNum: number) => days[dayNum - 1])
                  .join(", ")}
              </p>
            )}
          {payload.delivered && (
            <div className="flex items-center gap-2 bg-slate-900 rounded-md w-fit px-2 py-1">
              <Check size={20} className="text-green-400" />
              <p className="text-gray-100">{t("feed.card.delivered")}</p>
            </div>
          )}
        </div>
      }
    />
  );
}
