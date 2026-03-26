"use client";

import {
  formatDate,
  formatMeters,
  formatDurationLong,
  formatAveragePace,
  formatSpeed,
  formatDateShort,
  getDistanceUnitLabels,
} from "@/lib/formatDate";
import { templateSummary } from "@/types/models";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import { History } from "lucide-react";
import TemplateMap from "@/features/activities/templates/TemplateMap";
import { StatCard } from "@/components/StatCard";
import { ModalSwipeBlocker } from "@/components/modal";

type Props = {
  item: templateSummary;
  onHistory: () => void;
};

export default function ActivityTemplateExpanded({ item, onHistory }: Props) {
  const { t } = useTranslation("activities");
  const labels = getDistanceUnitLabels();

  const getActivityName = useCallback(
    (activity: templateSummary["activity"]) => {
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

  const hasStats = item.template.times_completed > 0;

  return (
    <div className="p-5 overflow-y-auto max-w-md mx-auto">
      <div className="text-sm text-gray-300 text-center">
        {t("activities.templatesScreen.created")}{" "}
        {formatDate(item.template.created_at)}
      </div>
      {item.template.updated_at && (
        <div className="text-sm text-yellow-500 mt-2 text-center">
          {t("activities.templatesScreen.updated")}{" "}
          {formatDate(item.template.updated_at)}
        </div>
      )}

      <div className="bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-lg overflow-hidden shadow-md mt-5">
        <div className="flex items-center justify-center border-b border-gray-700 my-5 mx-4 pb-2">
          <h2 className="text-xl flex-1 text-center">
            {item.template.name}
          </h2>
          <button
            onClick={onHistory}
            className="cursor-pointer text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="View history"
          >
            <History size={20} />
          </button>
        </div>
        <p className="text-lg text-center mb-5">{getActivityName(item.activity)}</p>
        {item.template.distance_meters && (
          <p className="text-xl text-center mb-5">
            {t("activities.templatesScreen.distance")}{" "}
            {formatMeters(item.template.distance_meters)}
          </p>
        )}
        {item.template.notes && (
          <p className="text-lg text-left text-gray-300">
            {item.template.notes}
          </p>
        )}
      </div>

      {item.route && item.route.coordinates.length > 0 && (
        <div className="mt-10">
          <ModalSwipeBlocker>
            <TemplateMap template={item} />
          </ModalSwipeBlocker>
        </div>
      )}

      {hasStats && (
        <div className="bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 p-4 rounded-lg overflow-hidden shadow-md mt-5">
          <p className="text-base text-gray-200 text-center mb-1">
            {t("activities.templatesScreen.timesCompleted", {
              count: item.template.times_completed,
            })}
          </p>
          {item.template.last_completed_at && (
            <p className="text-sm text-gray-400 text-center mb-3 font-body">
              {t("activities.templatesScreen.lastCompleted")}:{" "}
              {formatDateShort(item.template.last_completed_at)}
            </p>
          )}
          <div className="flex gap-2 mb-2">
            {item.template.avg_duration != null && (
              <StatCard
                label={t("activities.templatesScreen.avgDuration")}
                value={formatDurationLong(Math.round(item.template.avg_duration))}
              />
            )}
            {item.template.avg_pace != null && (
              <StatCard
                label={t("activities.templatesScreen.avgPace")}
                value={`${formatAveragePace(item.template.avg_pace)} ${labels.pace}`}
              />
            )}
          </div>
          <div className="flex gap-2">
            {item.template.avg_distance != null && (
              <StatCard
                label={t("activities.templatesScreen.avgDistance")}
                value={formatMeters(item.template.avg_distance)}
              />
            )}
            {item.template.avg_speed != null && (
              <StatCard
                label={t("activities.templatesScreen.avgSpeed")}
                value={formatSpeed(item.template.avg_speed)}
              />
            )}
          </div>
        </div>
      )}

      <div className="mt-10">
        <button
          disabled
          className="flex items-center justify-center w-full gap-2 bg-gray-700 py-2 rounded-md shadow-md border-[1.5px] border-gray-500 text-gray-400 text-lg cursor-not-allowed"
        >
          {t("activities.templatesScreen.startActivity")}
        </button>
        <p className="text-gray-400 text-sm text-center mt-2">
          {t("activities.templatesScreen.mobileOnly")}
        </p>
      </div>
    </div>
  );
}
