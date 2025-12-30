import { full_reminder } from "../../types/session";
import DropdownMenu from "../dropdownMenu";
import { Bell, Menu, SquareArrowOutUpRight } from "lucide-react";
import {
  formatDate,
  formatDateTime,
  formatNotifyTime,
} from "../../lib/formatDate";
import { formatWeekdays } from "../../lib/formatDate";

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
  const weekdays = formatWeekdays(item.weekdays as number[]);

  return (
    <div className="border border-gray-700 rounded-md flex flex-col justify-between bg-slate-900 mb-10 h-[138px]">
      <div className="flex justify-between items-center  mt-2 mx-4">
        <h1 className="mr-4 text-lg flex-1 line-clamp-2 underline">
          {item.title}
        </h1>

        {item.type === "global" && (
          <DropdownMenu
            button={
              <div aria-label="More options" className="cursor-pointer">
                <Menu size={20} color="#f3f4f6" />
              </div>
            }
            onEdit={() => onEdit(index)}
            onDelete={() => onDelete(index)}
          />
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        {item.type === "one-time" ? (
          <p>{formatDateTime(item.notify_date!)}</p>
        ) : item.type === "global_reminders" || item.type === "global" ? (
          <p>{formatDateTime(item.notify_at!)}</p>
        ) : (
          <>
            <p>{formatNotifyTime(item.notify_at_time!)}</p>
            {weekdays && <p>{weekdays}</p>}
          </>
        )}
        <Bell size={20} color="#f3f4f6" />
      </div>

      {item.updated_at && (
        <p className="ml-4 mb-1 text-yellow-500 text-sm">
          updated: {formatDate(item.updated_at!)}
        </p>
      )}
      <button
        aria-label="Expand reminder"
        onClick={onExpand}
        className="flex items-center justify-between w-full px-5 bg-blue-600 p-2 rounded-br-md rounded-bl-md cursor-pointer"
      >
        <p className=" text-gray-100 text-sm">{formatDate(item.created_at)}</p>
        <SquareArrowOutUpRight size={20} color="#f3f4f6" />
      </button>
    </div>
  );
}
