"use client";

import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ActivityType } from "@/database/activities/get-activity-types";

const TAB_WIDTH = 100;
const GAP = 8;

type ActivityTypeFilterChipsProps = {
  activityTypes: ActivityType[];
  selectedSlug: string | null;
  onSelectAll: () => void;
  onSelectType: (slug: string) => void;
};

export default function ActivityTypeFilterChips({
  activityTypes,
  selectedSlug,
  onSelectAll,
  onSelectType,
}: ActivityTypeFilterChipsProps) {
  const { t } = useTranslation("activities");
  const isAllSelected = !selectedSlug;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;

    const activeIndex = selectedSlug
      ? activityTypes.findIndex((a) => a.slug === selectedSlug) + 1
      : 0;

    const tabCenter = activeIndex * (TAB_WIDTH + GAP) + TAB_WIDTH / 2;
    const containerWidth = scrollRef.current.clientWidth;
    const scrollX = Math.max(0, tabCenter - containerWidth / 2);

    scrollRef.current.scrollTo({ left: scrollX, behavior: "smooth" });
  }, [selectedSlug, activityTypes]);

  return (
    <div className="sticky top-0 z-10 mb-4 bg-slate-800 rounded-lg">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto p-1 gap-2"
      >
        <button
          onClick={onSelectAll}
          className={`shrink-0 w-[100px] py-2 px-3 rounded-md transition-colors cursor-pointer ${
            isAllSelected ? "bg-slate-700" : ""
          }`}
        >
          <p
            className={`text-center truncate ${
              isAllSelected ? "text-cyan-400" : "text-gray-200"
            }`}
          >
            {t("activities.mySessions.all")}
          </p>
        </button>

        {activityTypes.map((type) => {
          const isActive = selectedSlug === type.slug;
          const translationKey = `activities.activityNames.${type.slug}`;
          const translated = t(translationKey, { defaultValue: type.name });
          return (
            <button
              key={type.slug}
              onClick={() => onSelectType(type.slug)}
              className={`shrink-0 w-[100px] py-2 px-3 rounded-md transition-colors cursor-pointer ${
                isActive ? "bg-slate-700" : ""
              }`}
            >
              <p
                className={`text-center truncate ${
                  isActive ? "text-cyan-400" : "text-gray-200"
                }`}
              >
                {translated}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
