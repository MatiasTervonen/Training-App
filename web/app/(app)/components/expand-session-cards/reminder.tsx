import { formatDate, formatDateTime } from "@/app/(app)/lib/formatDate";
import CopyButton from "@/app/(app)/components/buttons/CopyButton";
import { Bell, CalendarSync } from "lucide-react";
import { formatNotifyTime } from "@/app/(app)/lib/formatDate";
import { FeedItemUI } from "../../types/session";

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
  const payload = reminder.extra_fields as reminderPayload;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="page-padding mt-10">
      <div
        id="reminder-id"
        className={`max-w-lg mx-auto rounded-2xl border-2 border-slate-500 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 shadow-xl px-4 pb-2 ${payload.mode === "alarm" ? "pt-0" : "pt-10"}`}
      >
        {payload.mode === "alarm" && (
          <p className="text-sm text-yellow-500 my-4">High Priority Reminder</p>
        )}

        <div className="flex flex-col justify-center gap-4">
          <div className="flex gap-2 items-center justify-center bg-gray-900 rounded-xl py-5 border-2 border-slate-600 w-full">
            <CalendarSync size={28} />
            <p className="text-lg">
              {reminder.type === "global_reminders" ? "global" : reminder.type}
            </p>
          </div>

          <div className="flex gap-2 items-center justify-center bg-gray-900 rounded-xl py-5 border-2 border-slate-600 w-full px-2">
            <Bell size={28} />
            {reminder.type === "one-time" ? (
              <p className="text-lg">{formatDateTime(payload.notify_date!)}</p>
            ) : reminder.type === "global" ||
              reminder.type === "global_reminders" ? (
              <p className="text-lg">{formatDateTime(payload.notify_at!)}</p>
            ) : (
              <p className="text-lg">
                {formatNotifyTime(payload.notify_at_time!)}
              </p>
            )}
          </div>
        </div>

        {payload.weekdays &&
          Array.isArray(payload.weekdays) &&
          payload.weekdays.length > 0 && (
            <div className="bg-gray-900 rounded-xl border-2 border-slate-600 p-4 mt-6">
              <p className="text-center text-lg ">
                {(payload.weekdays as number[])
                  .map((dayNum) => days[dayNum - 1])
                  .join(", ")}
              </p>
            </div>
          )}

        <div className="bg-gray-900 rounded-xl p-5 mt-6 border-2 border-slate-600 text-center">
          <p className="text-xl wrap-break-word">{reminder.title}</p>
        </div>

        {payload.notes && (
          <div className="mt-6">
            <div className="bg-gray-900 rounded-xl border-2 border-slate-600 p-4 whitespace-pre-wrap">
              {payload.notes}
            </div>
          </div>
        )}
        <p className="text-sm text-gray-400 mt-8">
          Created: {formatDate(reminder.created_at)}
        </p>
        {reminder.updated_at && (
          <p className="text-sm text-yellow-500 mt-2">
            Updated: {formatDate(reminder.updated_at!)}
          </p>
        )}
      </div>
      <div className="flex justify-center mt-4">
        <CopyButton targetId="reminder-id" label="Copy Reminder" />
      </div>
    </div>
  );
}
