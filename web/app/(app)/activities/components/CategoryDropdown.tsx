"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "@/app/(app)/components/spinner";
import {
  getActivityCategories,
  ActivityCategory,
} from "@/app/(app)/database/activities/get-categories";

type Props = {
  onSelect: (category: ActivityCategory) => void;
};

export default function CategoryDropdown({ onSelect }: Props) {
  const { t } = useTranslation("activities");
  const [searchQuery, setSearchQuery] = useState("");

  const getCategoryName = useCallback(
    (category: ActivityCategory) => {
      if (category.slug) {
        const translated = t(`activities.categories.${category.slug}`, {
          defaultValue: "",
        });
        if (
          translated &&
          translated !== `activities.categories.${category.slug}`
        ) {
          return translated;
        }
      }
      return category.name;
    },
    [t]
  );

  const { data, error, isLoading } = useQuery({
    queryKey: ["activityCategories"],
    queryFn: getActivityCategories,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const filteredCategories = useMemo(() => {
    const list = data || [];
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((category) => {
      const translatedName = getCategoryName(category).toLowerCase();
      const originalName = category.name.toLowerCase();
      return translatedName.includes(query) || originalName.includes(query);
    });
  }, [data, searchQuery, getCategoryName]);

  return (
    <div className="flex flex-col px-2 w-full h-full z-50 pb-5">
      <div className="flex flex-col mt-12 px-20">
        <input
          type="text"
          value={searchQuery}
          placeholder={t("activities.categoryDropdown.searchPlaceholder")}
          autoComplete="off"
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
        />
      </div>

      <div
        className="w-full overflow-y-auto border rounded-md shadow-md
                bg-slate-900 border-gray-100 touch-pan-y mt-10 h-full"
      >
        {error ? (
          <p className="text-red-500 text-xl text-center p-4 px-10 mt-40">
            {t("activities.categoryDropdown.loadError")}
          </p>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-10 mt-40">
            <p className="text-lg">{t("activities.categoryDropdown.loading")}</p>
            <Spinner />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-lg px-5 mt-40 text-center">
            <p>{t("activities.categoryDropdown.noCategories")}</p>
            <p>{t("activities.categoryDropdown.addNewCategory")}</p>
          </div>
        ) : (
          <>
            <div className="text-center bg-blue-600 py-1">
              {t("activities.categoryDropdown.title")}
            </div>
            {filteredCategories.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSearchQuery(getCategoryName(item));
                  onSelect(item);
                }}
                className="w-full text-left px-4 py-3 border-b border-gray-600 hover:bg-slate-800 transition-colors"
              >
                <span className="text-gray-100">{getCategoryName(item)}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
