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
    <div className="border border-gray-700 rounded-md flex flex-col justify-center transition-colors bg-slate-900 mb-5">
      <div className="flex justify-between items-center my-2 mx-4">
        <div className="mr-8 line-clamp-1 text-lg underline">
          {item.template.name}
        </div>
        <DropdownMenu
          button={
            <div
              aria-label="More options"
              className="flex items-center justify-cente text-gray-100 cursor-pointer"
            >
              <Menu size={20} />
            </div>
          }
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {item.activity.name && (
        <div className="ml-4 text-slate-300">{getActivityName(item.activity)}</div>
      )}

      {item.template.updated_at ? (
        <div className="text-yellow-500 text-sm ml-4 my-2">
          {t("activities.templatesScreen.updated")}{" "}
          {formatDate(item.template.updated_at)}
        </div>
      ) : (
        <div className="h-[18px]" />
      )}

      <button
        aria-label="Expand template card"
        onClick={onExpand}
        className="flex justify-between items-center px-4 bg-blue-600 rounded-br-md rounded-bl-md hover:bg-blue-500 cursor-pointer py-2"
      >
        <div className="text-slate-300 text-sm">
          {formatDateShort(item.template.created_at)}
        </div>
        <div className="flex items-center gap-5">
          <p className="text-slate-300">{t("activities.templatesScreen.start")}</p>
          <Activity size={20} color="#cbd5e1" />
        </div>
      </button>
    </div>
  );
}
