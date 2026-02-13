"use client";

import { formatDate, formatMeters } from "@/lib/formatDate";
import { templateSummary } from "@/types/models";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import TemplateMap from "@/features/activities/templates/TemplateMap";

type Props = {
  item: templateSummary;
};

export default function ActivityTemplateExpanded({ item }: Props) {
  const { t } = useTranslation("activities");

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
        <h2 className="text-xl text-center mb-5 border-b border-gray-700  my-5 w-fit mx-auto">
          {item.template.name}
        </h2>
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
          <TemplateMap template={item} />
        </div>
      )}

      <div className="mt-10">
        <button
          disabled
          className="flex items-center justify-center w-full gap-2 bg-gray-700 py-2 rounded-md shadow-md border-2 border-gray-500 text-gray-400 text-lg cursor-not-allowed"
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
