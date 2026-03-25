"use client";

import { memo } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DailyFoodLog } from "@/types/nutrition";

type FoodLogItemProps = {
  item: DailyFoodLog;
  onPress?: () => void;
  onDelete: () => void;
  showBorder?: boolean;
};

export default memo(function FoodLogItem({
  item,
  onPress,
  onDelete,
  showBorder = true,
}: FoodLogItemProps) {
  const { t: tCommon } = useTranslation();

  const handleDelete = () => {
    const confirmed = window.confirm(
      tCommon("deleteButton.confirmDeleteMessage")
    );
    if (confirmed) {
      onDelete();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onPress?.();
      }}
      className={`flex items-center px-3 py-3 cursor-pointer hover:bg-slate-700/30 transition-colors ${
        showBorder ? "border-b border-slate-700/50" : ""
      }`}
    >
      <div className="flex-1 mr-3 min-w-0">
        <span className="text-sm truncate block">{item.food_name}</span>
        {item.brand && (
          <span className="font-body text-xs text-slate-400 truncate block">
            {item.brand}
          </span>
        )}
        <span className="font-body text-xs text-slate-500">
          {item.serving_size_g}g x {item.quantity}
        </span>
      </div>
      <div className="flex flex-col items-end mr-3">
        <span className="text-sm">{Math.round(item.calories)}</span>
        <span className="font-body text-xs text-slate-400">kcal</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        className="p-1 cursor-pointer hover:bg-slate-700/50 rounded transition-colors"
      >
        <Trash2 size={16} className="text-slate-500" />
      </button>
    </div>
  );
});
