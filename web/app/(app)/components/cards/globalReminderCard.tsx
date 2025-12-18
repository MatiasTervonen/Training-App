import { Ellipsis, SquareArrowOutUpRight, Bell, Check } from "lucide-react";
import DropdownMenu from "../dropdownMenu";
import { formatDate, formatDateTime } from "@/app/(app)/lib/formatDate";
import { full_reminder } from "../../types/session";

type Props = {
  item: full_reminder;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function GlobalReminderCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  return (
    <div
      className={`
       border rounded-md flex flex-col justify-between transition-colors min-h-[159px] ${
         pinned
           ? `border-yellow-200 bg-yellow-200 text-slate-900`
           : "bg-slate-700"
       }`}
    >
      <div className="flex justify-between items-center mt-2 mb-4 mx-4">
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
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>

      <div className="ml-4  mr-5 flex items-center">
        <p>{formatDateTime(item.notify_at!)}</p>
        <Bell size={20} className="ml-2" />
      </div>

      {item.delivered ? (
        <div className="flex items-center gap-2 bg-gray-900 rounded-md w-fit px-2 ml-2">
          <Check size={30} className="text-green-400" />
          <p className="text-gray-100">Delivered</p>
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
