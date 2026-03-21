"use client";

import { formatDate, formatDateShort } from "@/lib/formatDate";
import DropdownMenu from "@/components/dropdownMenu";
import { Activity, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { templateSummary } from "@/types/models";
import { useCallback } from "react";

type Props = {
  item: templateSummary;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function ActivityTemplateCard({
  item,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
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
    <div className="shadow-sm shadow-black/50 rounded-md mb-5">
      <div className="border border-slate-700 rounded-md flex flex-col justify-center transition-colors card-activity overflow-hidden">
        <div className="flex justify-between items-center px-4 pt-2 pb-1">
          <div className="mr-8 line-clamp-1 text-lg text-gray-100">
            {item.template.name}
          </div>
          <DropdownMenu
            button={
              <div
                aria-label="More options"
                className="cursor-pointer text-slate-400"
              >
                <Menu size={20} />
              </div>
            }
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>

        {item.activity.name && (
          <div className="px-4 text-slate-300 font-body">
            {getActivityName(item.activity)}
          </div>
        )}

        {item.template.updated_at && (
          <div className="text-slate-400 text-sm px-4 pb-1 font-body">
            {t("activities.templatesScreen.updated")}{" "}
            {formatDate(item.template.updated_at)}
          </div>
        )}

        <div className="flex justify-between items-center bg-slate-900/40 px-4 py-2 mt-2">
          <span className="text-slate-400 text-sm">
            {formatDateShort(item.template.created_at)}
          </span>
          <button
            aria-label="Expand template card"
            onClick={onExpand}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-slate-500 text-sm">
              {t("activities.templatesScreen.start")}
            </span>
            <Activity size={20} className="text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
