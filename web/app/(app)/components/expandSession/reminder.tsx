import { formatDate, formatDateTime } from "@/app/(app)/lib/formatDate";
import CopyButton from "../CopyButton";

import { Bell } from "lucide-react";
import { reminders } from "../../types/models";

export default function ReminderSession(reminder: reminders) {
  return (
    <div className="text-center px-4 text-gray-100 max-w-md mx-auto pb-10">
      <div className="text-sm text-gray-400 mt-5">
        {formatDate(reminder.created_at!)}
      </div>
      <div id="notes-id">
        <div className="my-5 text-xl wrap-break-word">{reminder.title}</div>
        <div className="flex items-center justify-center gap-2 my-5 text-xl">
          <p>{reminder.notify_at && formatDateTime(reminder.notify_at)}</p>
          <Bell className="inline ml-2" />
        </div>
        <div className="whitespace-pre-wrap wrap-break-word overflow-hidden max-w-full text-left bg-slate-900 p-4 rounded-md shadow-lg">
          {reminder.notes}
        </div>
      </div>
      <CopyButton targetId="notes-id" />
    </div>
  );
}
