"use client";

import { formatDate, formatDateTime, formatNotifyTime } from "@/lib/formatDate";
import { Bell, CalendarSync, AlertTriangle } from "lucide-react";
import { FeedItemUI } from "@/types/session";
import { useTranslation } from "react-i18next";

const typeTranslationKeys: Record<string, string> = {
  "one-time": "oneTime",
  weekly: "weekly",
  daily: "daily",
  global_reminders: "global",
};

type reminderPayload = {
  notify_date: string;
  notify_at: string;
  notify_at_time: string;
  weekdays: number[];
  notes: string;
  type: string;
  mode: "alarm" | "normal";
};

export default function ReminderSession(reminder: FeedItemUI) {
  const { t } = useTranslation("reminders");
  const payload = reminder.extra_fields as reminderPayload;

  const days = [
    t("reminders.days.sun"),
    t("reminders.days.mon"),
    t("reminders.days.tue"),
    t("reminders.days.wed"),
    t("reminders.days.thu"),
    t("reminders.days.fri"),
    t("reminders.days.sat"),
  ];

  return (
    <div className="page-padding max-w-lg mx-auto">
      <p className="text-sm text-gray-400 text-center font-body">
        {t("reminders.created")} {formatDate(reminder.created_at)}
      </p>
      {reminder.updated_at && (
        <p className="text-sm text-slate-400 mt-1 text-center font-body">
          {t("reminders.updated")} {formatDate(reminder.updated_at)}
        </p>
      )}

      {payload.mode === "alarm" && (
        <div className="flex items-center justify-center gap-2 mt-4 bg-yellow-500/15 rounded-md px-3 py-2 w-fit mx-auto">
          <AlertTriangle size={16} className="text-yellow-500" />
          <span className="text-sm text-yellow-500">
            {t("reminders.highPriorityReminder")}
          </span>
        </div>
      )}

      <h2 className="text-2xl text-center mt-5 wrap-break-word">
        {reminder.title}
      </h2>

      <div className="bg-white/5 border border-white/10 rounded-md mt-6">
        {/* Type */}
        <div className="flex items-center px-4 py-4 border-b border-gray-700">
          <CalendarSync size={20} className="text-slate-400" />
          <span className="text-slate-400 text-sm ml-3 font-body">
            {t("reminders.typeLabel")}
          </span>
          <span className="ml-auto text-lg">
            {t(`reminders.${typeTranslationKeys[payload.type] || payload.type}`)}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center px-4 py-4 border-b border-gray-700">
          <Bell size={20} className="text-slate-400" />
          <span className="text-slate-400 text-sm ml-3 font-body">
            {t("reminders.timeLabel")}
          </span>
          <span className="ml-auto text-lg">
            {payload.type === "one-time"
              ? formatDateTime(payload.notify_date!)
              : reminder.type === "global" ||
                  reminder.type === "global_reminders"
                ? formatDateTime(payload.notify_at!)
                : formatNotifyTime(payload.notify_at_time!)}
          </span>
        </div>

        {/* Weekdays */}
        {payload.weekdays && payload.weekdays.length > 0 && (
          <div className="px-4 py-4 border-b border-gray-700">
            <span className="text-slate-400 text-sm mb-2 block font-body">
              {t("reminders.weekdaysLabel")}
            </span>
            <div className="flex flex-wrap gap-2">
              {payload.weekdays.map((dayNum) => (
                <div
                  key={dayNum}
                  className="bg-white/10 rounded-md px-3 py-1"
                >
                  <span className="text-sm">{days[dayNum - 1]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {payload.notes && (
          <div className="px-4 py-4">
            <p className="text-gray-200 leading-5 font-body whitespace-pre-wrap">
              {payload.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
