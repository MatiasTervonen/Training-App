"use client";

import { full_reminder } from "@/types/session";
import DropdownMenu from "@/components/dropdownMenu";
import { Bell, Menu, SquareArrowOutUpRight } from "lucide-react";
import {
  formatDate,
  formatDateTime,
  formatNotifyTime,
  formatDateShort,
} from "@/lib/formatDate";
import { useTranslation } from "react-i18next";

type Props = {
  item: full_reminder;
  onDelete: (index: number) => void;
  onExpand: () => void;
  onEdit: (index: number) => void;
  index: number;
};

export default function MyReminderCard({
  index,
  item,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  const { t } = useTranslation("feed");

  const weekdays = [
    t("feed.card.weekdays.sun"),
    t("feed.card.weekdays.mon"),
    t("feed.card.weekdays.tue"),
    t("feed.card.weekdays.wed"),
    t("feed.card.weekdays.thu"),
    t("feed.card.weekdays.fri"),
    t("feed.card.weekdays.sat"),
  ];

  return (
    <div className="shadow-sm shadow-black/50 rounded-md mb-10">
      <div className="border border-slate-700 rounded-md flex flex-col justify-between card-reminder overflow-hidden min-h-[138px]">
        <div className="flex justify-between items-center px-4 pt-2 pb-1">
          <h1 className="mr-4 text-lg flex-1 line-clamp-2 text-gray-100">
            {item.title}
          </h1>

          {item.type === "global" && (
            <DropdownMenu
              button={
                <div aria-label="More options" className="cursor-pointer text-slate-400">
                  <Menu size={20} />
                </div>
              }
              onEdit={() => onEdit(index)}
              onDelete={() => onDelete(index)}
            />
          )}
        </div>

        <div className="flex items-center gap-2 px-4 font-body text-slate-300">
          {item.type === "one-time" ? (
            <span>{formatDateTime(item.notify_date!)}</span>
          ) : item.type === "global_reminders" || item.type === "global" ? (
            <span>{formatDateTime(item.notify_at!)}</span>
          ) : (
            <>
              <span>{formatNotifyTime(item.notify_at_time!)}</span>
              {weekdays && <span>{weekdays}</span>}
            </>
          )}
          <Bell size={20} className="text-slate-300" />
        </div>

        {item.updated_at && (
          <p className="px-4 pb-1 text-slate-400 text-sm font-body">
            {t("feed.card.updated")} {formatDate(item.updated_at!)}
          </p>
        )}

        <div className="flex items-center justify-between bg-slate-900/40 px-4 py-2">
          <span className="text-slate-400 text-sm">
            {formatDateShort(item.created_at)}
          </span>
          <button
            aria-label="Expand reminder"
            onClick={onExpand}
            className="flex items-center gap-2 cursor-pointer"
          >
            <SquareArrowOutUpRight size={18} className="text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
