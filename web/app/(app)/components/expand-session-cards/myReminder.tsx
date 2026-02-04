"use client";

import { formatDate, formatDateTime } from "@/app/(app)/lib/formatDate";
import CopyButton from "@/app/(app)/components/buttons/CopyButton";
import { Bell, CalendarSync } from "lucide-react";
import { formatNotifyTime } from "@/app/(app)/lib/formatDate";
import { full_reminder } from "@/app/(app)/types/session";
import { useTranslation } from "react-i18next";

export default function MyReminderSession(reminder: full_reminder) {
  const { t } = useTranslation("reminders");
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
    <div className="page-padding mt-10">
      <div
        id="reminder-id"
        className="max-w-lg mx-auto rounded-2xl border-2 border-slate-500 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 shadow-xl p-4"
      >
        <div className="flex flex-col justify-center gap-4">
          <div className="flex gap-2 items-center justify-center bg-gray-900 rounded-xl py-5 border-2 border-slate-600 w-full">
            <CalendarSync size={28} />
            <p className="text-lg">
              {reminder.type === "global_reminders" ? t("reminders.global") : reminder.type}
            </p>
          </div>

          <div className="flex items-center gap-2 justify-center bg-gray-900 rounded-xl py-5 border-2 border-slate-600 w-full px-2">
            <Bell size={28} />
            {reminder.type === "one-time" ? (
              <p className="text-lg">{formatDateTime(reminder.notify_date!)}</p>
            ) : reminder.type === "global" ||
              reminder.type === "global_reminders" ? (
              <p className="text-lg">{formatDateTime(reminder.notify_at!)}</p>  
            ) : (
              <p className="text-lg">
                {formatNotifyTime(reminder.notify_at_time!)}
              </p>
            )}
          </div>
        </div>

        {reminder.weekdays &&
          Array.isArray(reminder.weekdays) &&
          reminder.weekdays.length > 0 && (
            <div className="bg-gray-900 rounded-xl border-2 border-slate-600 p-4 mt-6">
              <p className="text-center text-lg ">
                {(reminder.weekdays as number[])
                  .map((dayNum) => days[dayNum - 1])
                  .join(", ")}
              </p>
            </div>
          )}

        <div className="bg-gray-900 rounded-xl p-5 mt-6 border-2 border-slate-600 text-center">
          <p className="text-xl wrap-break-word">{reminder.title}</p>
        </div>

        {reminder.notes && (
          <div className="mt-6">
            <div className="bg-gray-900 rounded-xl border-2 border-slate-600 p-4 whitespace-pre-wrap">
              {reminder.notes}
            </div>
          </div>
        )}
        <p className="text-sm text-gray-400 mt-8">
          {t("reminders.created")} {formatDate(reminder.created_at)}
        </p>
        {reminder.updated_at && (
          <p className="text-sm text-yellow-500 mt-2">
            {t("reminders.updated")} {formatDate(reminder.updated_at!)}
          </p>
        )}
      </div>
      <div className="flex justify-center mt-4">
        <CopyButton targetId="reminder-id" label={t("reminders.copyReminder")} />
      </div>
    </div>
  );
}
