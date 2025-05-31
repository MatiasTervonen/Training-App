import { russoOne } from "@/app/ui/fonts";
import { Dumbbell, Ellipsis, SquareArrowOutUpRight } from "lucide-react";
import DropdownMenu from "../dropdownMenu";
import { formatDate } from "@/lib/formatDate";
import { GymSessionFull } from "@/types/session";

type Props = {
  item: GymSessionFull;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function GymCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  console.log("Pinned:", pinned);

  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div
      className={`${
        russoOne.className
      } border rounded-md flex flex-col justify-center mb-5 transition-colors ${
        pinned
          ? " border-yellow-200 bg-yellow-200 text-slate-900"
          : "bg-slate-700"
      }`}
    >
      <div className=" flex justify-between items-center">
        <div className="p-3">{item.title}</div>
        <DropdownMenu
          button={
            <div
              className={`flex items-center justify-center p-[14px] rounded-tr-md ${
                pinned ? "text-slate-900" : "text-gray-100"
              }`}
            >
              <Ellipsis size={20} />
            </div>
          }
        >
          <button
            onClick={() => {
              onEdit();
            }}
            className="border-b py-2 px-4"
          >
            Edit
          </button>
          <button
            onClick={() => {
              onTogglePin();
            }}
            className="border-b py-2"
          >
            {pinned ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={() => {
              onDelete();
            }}
            className="py-2"
          >
            Delete
          </button>
        </DropdownMenu>
      </div>

      <div className="pb-3 ml-3">
        {item.notes.length > 20 ? `${item.notes.slice(0, 20)}...` : item.notes}
      </div>
      <div className="flex justify-between items-center mt-2 bg-black/40 rounded-b-md">
        {/* Icon */}

        <div className="flex items-center gap-4">
          <div className=" p-2 rounded-bl-md">
            <Dumbbell size={20} />
          </div>
          <span>Gym</span>

          {/* Date */}

          <div className=" p-[8px]">
            <p
              className={` text-sm ${
                pinned ? "text-slate-900" : "text-gray-100"
              }`}
            >
              {formatDate(item.created_at)}
            </p>
          </div>
          <p>{formatDuration(item.duration)}</p>
        </div>

        <button
          onClick={onExpand}
          className="bg-blue-500 text-gray-100 p-2 rounded-br-md hover:bg-blue-400"
        >
          <span>
            <SquareArrowOutUpRight size={20} />
          </span>
        </button>
      </div>
    </div>
  );
}
