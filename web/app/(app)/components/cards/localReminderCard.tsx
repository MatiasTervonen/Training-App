import { Ellipsis, SquareArrowOutUpRight, Bell, Check } from "lucide-react";
import DropdownMenu from "../dropdownMenu";
import {
  formatDate,
  formatDateTime,
  formatNotifyTime,
} from "@/app/(app)/lib/formatDate";
import { local_reminders } from "../../types/models";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFullLocalReminder } from "../../database/reminder";

type Props = {
  item: local_reminders;
  pinned: boolean;
  onTogglePin: () => void;
  onExpand: () => void;
};

export default function LocalReminderCard({
  item,
  pinned,
  onTogglePin,
  onExpand,
}: Props) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const queryClient = useQueryClient();
  const cached = queryClient.getQueryData(["fullLocalReminder", item.id]);

  const { data: fullLocalReminder } = useQuery<local_reminders>({
    queryKey: ["fullLocalReminder", item.id],
    queryFn: () => getFullLocalReminder(item.id),
    enabled: !!cached,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const weekdays = fullLocalReminder?.weekdays as number[] | null | undefined;

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
          weekdays && weekdays.length > 0 ? "mb-2" : "mb-4"
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
        >
          <button
            aria-label="Pin or unpin note"
            onClick={() => {
              onTogglePin();
            }}
            className=" py-2 px-4 hover:bg-gray-600 rounded-md"
          >
            {pinned ? "Unpin" : "Pin"}
          </button>
        </DropdownMenu>
      </div>

      <div className="ml-4 mr-5 flex items-center">
        <p>
          {" "}
          {item.notify_at_time
            ? formatNotifyTime(item.notify_at_time!)
            : formatDateTime(item.notify_date!)}
        </p>
        {item.seen_at ? (
          <Check size={30} className="ml-2 text-green-400" />
        ) : (
          <Bell size={20} className="ml-2" />
        )}
      </div>

      {weekdays && Array.isArray(weekdays) && weekdays.length > 0 && (
        <p className={`ml-4 ${pinned ? "text-slate-900" : "text-gray-100"}`}>
          {weekdays.map((dayNum: number) => days[dayNum - 1]).join(", ")}
        </p>
      )}

      {item.updated_at && (
        <p
          className={`text-sm ml-4 mt-auto ${
            pinned ? "text-slate-900" : "text-yellow-500"
          } `}
        >
          updated: {formatDate(item.updated_at!)}
        </p>
      )}

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
