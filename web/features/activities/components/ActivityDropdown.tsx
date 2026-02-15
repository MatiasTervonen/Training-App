"use client";

import { useQuery } from "@tanstack/react-query";
import { getActivities } from "@/database/activities/get-activities";
import { getRecentActivities } from "@/database/activities/get-recent-activities";
import { activities_with_category } from "@/types/models";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "@/components/spinner";

type Props = {
  onSelect: (activity: activities_with_category) => void;
  selectedActivity?: activities_with_category | null;
};

export default function ActivityDropdown({
  onSelect,
  selectedActivity,
}: Props) {
  const { t } = useTranslation("activities");
  const [searchQuery, setSearchQuery] = useState("");

  const getActivityName = useCallback(
    (activity: activities_with_category) => {
      if (activity.slug) {
        const translated = t(`activities.activityNames.${activity.slug}`, {
          defaultValue: "",
        });
        if (
          translated &&
          translated !== `activities.activityNames.${activity.slug}`
        ) {
          return translated;
        }
      }
      return activity.name;
    },
    [t]
  );

  const getCategoryName = useCallback(
    (activity: activities_with_category) => {
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

  const {
    data: allActivities,
    error: activitiesError,
    isLoading: isActivitiesLoading,
  } = useQuery({
    queryKey: ["activities"],
    queryFn: () => getActivities(),
  });

  const {
    data: recentActivities,
    error: recentError,
    isLoading: isRecentLoading,
  } = useQuery({
    queryKey: ["recentActivities"],
    queryFn: getRecentActivities,
  });

  const isLoading = isActivitiesLoading || isRecentLoading;
  const isError = activitiesError || recentError;

  const recentActivitiesList = recentActivities || [];

  const filteredActivities = useMemo(() => {
    const list = allActivities || [];
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((activity) => {
      const translatedName = getActivityName(activity).toLowerCase();
      const translatedCategory = getCategoryName(activity).toLowerCase();
      return (
        translatedName.includes(query) ||
        translatedCategory.includes(query) ||
        activity.name.toLowerCase().includes(query)
      );
    });
  }, [allActivities, searchQuery, getActivityName, getCategoryName]);

  const sections: { title: string; data: activities_with_category[] }[] = [];

  if (!isError && !isLoading) {
    if (recentActivitiesList.length > 0 && searchQuery.length === 0) {
      sections.push({
        title: t("activities.activityDropdown.recentActivities"),
        data: recentActivitiesList,
      });
    }

    sections.push({
      title: t("activities.activityDropdown.allActivities"),
      data: filteredActivities,
    });
  }

  const handleSelectActivity = (activity: activities_with_category) => {
    setSearchQuery("");
    onSelect(activity);
  };

  return (
    <div className="flex flex-col px-2 w-full h-full z-50 pb-5">
      <div className="flex flex-col mt-12 px-20">
        <input
          type="text"
          value={searchQuery}
          placeholder={t("activities.activityDropdown.searchPlaceholder")}
          autoComplete="off"
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
        />
      </div>

      <div
        className="w-full overflow-y-auto border rounded-md shadow-md
                bg-slate-900 border-gray-100 touch-pan-y mt-10 h-full"
      >
        {isError ? (
          <p className="text-red-500 text-xl text-center p-4 px-10 mt-40">
            {t("activities.activityDropdown.loadError")}
          </p>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-10 mt-40">
            <p className="text-lg">
              {t("activities.activityDropdown.loading")}
            </p>
            <Spinner />
          </div>
        ) : filteredActivities.length === 0 ? (
          <p className="text-lg text-gray-300 py-20 text-center px-10 mt-40">
            {t("activities.activityDropdown.noActivities")}
          </p>
        ) : (
          sections.map((section) => (
            <div key={section.title}>
              <div className="text-center bg-blue-600 py-1">
                {section.title}
              </div>
              {section.data.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectActivity(item)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-600 transition-colors ${
                    selectedActivity?.id === item.id ? "bg-blue-800" : "hover:bg-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className=" text-gray-100 truncate mr-4">
                      {getActivityName(item)}
                    </span>
                    <span className="text-gray-400">
                      {getCategoryName(item)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
