import { formatDate, formatDateTime } from "@/app/(app)/lib/formatDate";
import CopyButton from "../CopyButton";

import { Bell, CalendarSync } from "lucide-react";
import { reminders } from "../../types/models";

export default function ReminderSession(reminder: reminders) {
  return (
    <div>
      <div
        id="reminder-id"
        className="mt-20 mb-10 pt-10 px-6 rounded-xl w-full border-2 border-slate-700  shadow-md bg-linear-to-tr from-slate-950 via-slate-950 to-blue-900 max-w-xl mx-auto"
      >
        <div className="flex justify-center">
          <div className="flex flex-col items-center justify-center mt-5 bg-slate-800 p-5 rounded-md flex-1 border border-gray-600">
            <CalendarSync color="#f3f4f6" />
            <p className="mt-2 text-xl text-center">Global</p>
          </div>
          <div className="flex flex-col items-center justify-center mt-5 bg-slate-800 p-5 rounded-md flex-1 ml-5 border border-gray-600">
            <Bell color="#f3f4f6" />

            <div className="flex items-center gap-3 justify-center ">
              <p className="text-center mt-2 text-lg">
                {formatDateTime(reminder.notify_at)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 mt-5 rounded-md p-5 border border-gray-600">
          <p className="text-xl wrap-break-word text-center">
            {reminder.title}
          </p>
        </div>
        {reminder.notes && (
          <div>
            <div className="whitespace-pre-wrap wrap-break-word  text-left bg-slate-800 p-4 rounded-md shadow-lg mt-5 border border-gray-600">
              {reminder.notes}
            </div>
          </div>
        )}
        <p className="text-sm text-gray-400 mb-2 mt-8">
          Created at: {formatDate(reminder.created_at)}
        </p>
      </div>
      <div className="flex justify-center">
        <CopyButton targetId="reminder-id" label="Copy Reminder" />
      </div>
    </div>
  );
}
