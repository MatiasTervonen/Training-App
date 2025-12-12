import { formatDate, formatDateTime } from "@/app/(app)/lib/formatDate";
import CopyButton from "../CopyButton";

import { Bell, CalendarSync } from "lucide-react";
import { reminders } from "../../types/models";

export default function ReminderSession(reminder: reminders) {
  return (
    <div className="page-padding mt-10">
      <div
        id="reminder-id"
        className="max-w-lg mx-auto rounded-2xl border-2 border-slate-500 bg-linear-to-tr from-gray-900 via-slate-800 to-blue-900 shadow-xl p-4"
      >
        <div className="flex justify-center gap-4">
          <div className="flex flex-col items-center justify-center bg-gray-900 rounded-xl py-5 border-2 border-slate-600 w-full">
            <CalendarSync size={28} />
            <p className="mt-2">Global</p>
          </div>

          <div className="flex flex-col items-center justify-center bg-gray-900 rounded-xl py-5 border-2 border-slate-600 w-full px-2">
            <Bell size={28} />
            <p className="mt-2 text-center">
              {formatDateTime(reminder.notify_at)}
            </p>
          </div>
        </div>

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
        <p className="text-sm text-gray-400 mt-8 text-center">
          Created at: {formatDate(reminder.created_at)}
        </p>
      </div>
      <div className="flex justify-center mt-4">
        <CopyButton targetId="reminder-id" label="Copy Reminder" />
      </div>
    </div>
  );
}
