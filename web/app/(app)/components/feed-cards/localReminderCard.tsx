import { Ellipsis, SquareArrowOutUpRight, Bell, Check } from "lucide-react";
import DropdownMenu from "../dropdownMenu";
import {
  formatDate,
  formatDateTime,
  formatNotifyTime,
} from "@/app/(app)/lib/formatDate";
import { FeedCardProps } from "@/app/(app)/types/session";

type reminderPayload = {
  notify_date: string;
  notify_at: string;
  notify_at_time: string;
  weekdays: number[];
  seen_at: string;
  delivered: boolean;
};

export default function LocalReminderCard({
  item,
  pinned,
  onTogglePin,
  onExpand,
}: FeedCardProps) {
  const payload = item.extra_fields as reminderPayload;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      className={`
       border rounded-md flex flex-col justify-between transition-colors min-h-[159px] ${
         pinned
           ? `border-yellow-200 bg-yellow-200 text-slate-900`
           : "bg-slate-700"
       }`}
    >
      <div
        className={`flex justify-between items-center mt-2 mx-4 ${
          payload.weekdays && payload.weekdays.length > 0 ? "mb-2" : "mb-4"
        }`}
      >
        <div className="mr-8 line-clamp-1 border-b">{item.title}</div>
        <DropdownMenu
          button={
            <div
              aria-label="More options"
              className={`cursor-pointer ${
                pinned ? "text-slate-900" : "text-gray-100"
              }`}
            >
              <Ellipsis size={20} />
            </div>
          }
          pinned={pinned}
          onTogglePin={onTogglePin}
        />
      </div>
      <div className="ml-4 mr-5 flex items-center">
        <p>
          {" "}
          {payload.notify_at_time
            ? formatNotifyTime(payload.notify_at_time!)
            : formatDateTime(payload.notify_date!)}
        </p>
        {payload.seen_at ? (
          <Check size={30} className="ml-2 text-green-400" />
        ) : (
          <Bell size={20} className="ml-2" />
        )}
      </div>

      {payload.weekdays &&
        Array.isArray(payload.weekdays) &&
        payload.weekdays.length > 0 && (
          <p className={`ml-4 ${pinned ? "text-slate-900" : "text-gray-100"}`}>
            {payload.weekdays
              .map((dayNum: number) => days[dayNum - 1])
              .join(", ")}
          </p>
        )}

      {payload.delivered ? (
        <div className="flex items-center gap-2 bg-slate-900 rounded-md w-fit px-2 ml-2">
          <Check size={30} className="text-green-400" />
          <p>Delivered</p>
        </div>
      ) : item.updated_at ? (
        <p
          className={`text-sm ml-4 mt-auto ${
            pinned ? "text-slate-900" : "text-yellow-500"
          } `}
        >
          updated: {formatDate(item.updated_at!)}
        </p>
      ) : null}

      <div className="flex justify-between items-center mt-2 bg-black/40 rounded-b-md">
        {/* Icon */}

        <div className="flex items-center gap-4">
          <div className="pl-2">
            <Bell size={20} />
          </div>
          <span>Reminders</span>

          {/* Date */}

          <p className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            {formatDate(item.created_at)}
          </p>
        </div>

        <button
          aria-label="Expand note"
          onClick={onExpand}
          className="bg-blue-500 text-gray-100 p-2 rounded-br-md hover:bg-blue-400 cursor-pointer"
        >
          <span>
            <SquareArrowOutUpRight size={20} />
          </span>
        </button>
      </div>
    </div>
  );
}
