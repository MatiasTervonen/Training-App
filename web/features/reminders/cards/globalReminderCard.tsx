"use client";

import { Bell, Check } from "lucide-react";
import { formatDateTime } from "@/lib/formatDate";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
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
      typeIcon={<Bell size={20} className="text-pink-500" />}
      typeName={t("feed.card.types.reminder")}
      showUpdatedAt={!payload.delivered}
      statsContent={
        <div className="flex flex-col gap-2 text-slate-300">
          <div className="flex items-center gap-2">
            <span>{formatDateTime(payload.notify_at)}</span>
            <Bell size={20} />
          </div>
          {payload.delivered && (
            <div className="flex items-center gap-2 bg-slate-900/60 rounded-md w-fit px-2 py-1">
              <Check size={20} className="text-green-400" />
              <span className="text-gray-100">{t("feed.card.delivered")}</span>
            </div>
          )}
        </div>
      }
    />
  );
}
