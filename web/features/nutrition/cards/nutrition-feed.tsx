"use client";

import { Utensils } from "lucide-react";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type NutritionPayload = {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  entry_count: number;
  calorie_goal: number;
};

export default function NutritionCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onHide,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const { t: tNutrition } = useTranslation("nutrition");
  const payload = item.extra_fields as NutritionPayload;

  return (
    <BaseFeedCard
      item={{ ...item, title: tNutrition("title") }}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onHide={onHide}
      typeIcon={<Utensils size={20} className="text-slate-300" />}
      typeName={t("feed.card.types.nutrition")}
      showUpdatedAt={true}
      statsContent={
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <span className="text-lg">
              {Math.round(payload.total_calories)} / {payload.calorie_goal}
            </span>
            <span className="font-body text-sm text-slate-400">{tNutrition("feed.kcal")}</span>
          </div>
          <div className="flex gap-4">
            <span className="font-body text-sm text-slate-400">
              {tNutrition("feed.proteinShort")}: {Math.round(payload.total_protein)}g
            </span>
            <span className="font-body text-sm text-slate-400">
              {tNutrition("feed.carbsShort")}: {Math.round(payload.total_carbs)}g
            </span>
            <span className="font-body text-sm text-slate-400">
              {tNutrition("feed.fatShort")}: {Math.round(payload.total_fat)}g
            </span>
          </div>
          <span className="font-body text-xs text-slate-500">
            {payload.entry_count} {payload.entry_count === 1 ? tNutrition("feed.entry") : tNutrition("feed.entries")}
          </span>
        </div>
      }
    />
  );
}
