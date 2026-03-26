"use client";

import Spinner from "@/components/spinner";
import { useTranslation } from "react-i18next";
import type { NutritionSearchResult } from "@/types/nutrition";

type FoodSearchListProps = {
  results: NutritionSearchResult[];
  isSearching: boolean;
  query: string;
  onSelect: (food: NutritionSearchResult) => void;
};

export default function FoodSearchList({ results, isSearching, query, onSelect }: FoodSearchListProps) {
  const { t } = useTranslation("nutrition");

  if (isSearching) {
    return (
      <div className="flex flex-col items-center py-10 gap-2">
        <Spinner />
        <span className="font-body text-sm">{t("log.searching")}</span>
      </div>
    );
  }

  if (query.length > 0 && results.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 px-6">
        <p className="text-base mb-2">{t("log.noResults")}</p>
        <p className="font-body text-sm text-center text-slate-400">{t("log.noResultsDesc")}</p>
      </div>
    );
  }

  return (
    <div>
      {results.map((item, index) => (
        <button
          key={item.barcode ?? item.id ?? `${index}`}
          onClick={() => onSelect(item)}
          className="w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-center">
            <div className="flex-1 mr-3 overflow-hidden">
              <p className="font-body text-sm truncate">{item.name}</p>
              {item.brand && (
                <p className="font-body text-xs text-slate-400 truncate">{item.brand}</p>
              )}
            </div>
            <span className="font-body text-sm text-slate-400 shrink-0">
              {Math.round(item.calories_per_100g)} kcal
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
