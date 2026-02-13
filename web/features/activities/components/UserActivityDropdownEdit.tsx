"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "@/components/spinner";
import {
  getUserActivities,
  UserActivity,
} from "@/database/activities/get-user-activities";

type Props = {
  onSelect: (activity: UserActivity) => void;
};

export default function UserActivityDropdownEdit({ onSelect }: Props) {
  const { t } = useTranslation("activities");
  const [searchQuery, setSearchQuery] = useState("");

  const getCategoryName = useCallback(
    (activity: UserActivity) => {
      const categorySlug = activity.activity_categories?.slug;
      if (categorySlug) {
        const translated = t(`activities.categories.${categorySlug}`, {
          defaultValue: "",
        });
        if (
          translated &&
          translated !== `activities.categories.${categorySlug}`
        ) {
          return translated;
        }
      }
      return activity.activity_categories?.name || "";
    },
    [t]
  );

  const { data, error, isLoading } = useQuery({
    queryKey: ["userActivities"],
    queryFn: () => getUserActivities(),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const filteredActivities = useMemo(() => {
    const list = data || [];
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((activity) => {
      const name = activity.name.toLowerCase();
      return name.includes(query);
    });
  }, [data, searchQuery]);

  return (
    <div className="flex flex-col px-2 w-full h-full z-50 pb-5">
      <div className="flex flex-col mt-12 px-20">
        <input
          type="text"
          value={searchQuery}
          placeholder={t("activities.activityDropdownEdit.searchPlaceholder")}
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
            {t("activities.activityDropdownEdit.loadError")}
          </p>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-10 mt-40">
            <p className="text-lg">
              {t("activities.activityDropdownEdit.loading")}
            </p>
            <Spinner />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-lg px-5 mt-40 text-center">
            <p>{t("activities.activityDropdownEdit.noActivities")}</p>
            <p>{t("activities.activityDropdownEdit.addNewActivity")}</p>
          </div>
        ) : (
          <>
            <div className="text-center bg-blue-600 py-1">
              {t("activities.activityDropdownEdit.myActivities")}
            </div>
            {filteredActivities.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSearchQuery(item.name);
                  onSelect(item);
                }}
                className="w-full text-left px-4 py-3 border-b border-gray-600 hover:bg-slate-800 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-100 truncate mr-4">
                    {item.name}
                  </span>
                  <span className="text-gray-400 shrink-0">
                    {getCategoryName(item)}
                  </span>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
