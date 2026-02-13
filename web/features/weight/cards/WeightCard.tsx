"use client";

import { Scale } from "lucide-react";
import { useUserStore } from "@/lib/stores/useUserStore";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type weightPayload = {
  weight: number;
};

export default function WeightCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as weightPayload;

  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<Scale size={20} className={pinned ? "text-slate-900" : "text-gray-100"} />}
      typeName={t("feed.card.types.weight")}
      statsContent={
        <p className={`text-lg ${pinned ? "text-slate-900" : "text-gray-100"}`}>
          {payload.weight} {weightUnit}
        </p>
      }
    />
  );
}
