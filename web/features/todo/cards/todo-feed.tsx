"use client";

import { ListTodo, Check } from "lucide-react";
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
      typeIcon={<ListTodo size={20} className="text-slate-300" />}
      typeName={t("feed.card.types.todo")}
      showUpdatedAt={true}
      statsContent={
        <div className="flex gap-2 items-center text-slate-300">
          <span>
            {t("feed.card.completed")}: {payload.completed} / {payload.total}
          </span>
          {payload.completed === payload.total && (
            <Check color="#22c55e" size={24} />
          )}
        </div>
      }
    />
  );
}
