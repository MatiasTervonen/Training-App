import { Dumbbell, Ellipsis, SquareArrowOutUpRight } from "lucide-react";
import DropdownMenu from "../dropdownMenu";
import { formatDate, formatDateShort } from "@/app/(app)/lib/formatDate";
import { gym_sessions } from "../../types/models";

type Props = {
  item: gym_sessions;
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
      className={`
       border rounded-md flex flex-col  transition-colors min-h-[159px] justify-between ${
         pinned
           ? " border-yellow-200 bg-yellow-200 text-slate-900"
           : "bg-slate-700"
       }`}
    >
      <div className="flex justify-between items-center mt-2 mb-4 mx-4">
        <div className="line-clamp-1 border-b">{item.title}</div>
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
            aria-label="Edit gym session"
            onClick={() => {
              onEdit();
            }}
            className="border-b py-2 px-4 hover:bg-gray-600"
          >
            Edit
          </button>
          <button
            aria-label="Pin or unpin gym session"
            onClick={() => {
              onTogglePin();
            }}
            className="border-b py-2 px-4 hover:bg-gray-600"
          >
            {pinned ? "Unpin" : "Pin"}
          </button>
          <button
            aria-label="Delete gym session"
            onClick={() => {
              onDelete();
            }}
            className="py-2 px-4 hover:bg-gray-600"
          >
            Delete
          </button>
        </DropdownMenu>
      </div>

      <div className="ml-4 mb-4 mr-5 line-clamp-2">{item.notes}</div>
      <div className="flex justify-between items-center mt-2 bg-black/40 rounded-b-md">
        {/* Icon */}

        <div className="flex items-center gap-4">
          <div className=" p-2 rounded-bl-md">
            <Dumbbell size={20} />
          </div>
          <span>Gym</span>

          {/* Date */}

          <div>
            <p className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
              <span className="hidden xs:inline">
                {formatDate(item.created_at)}
              </span>
              <span className="inline xs:hidden">
                {formatDateShort(item.created_at)}
              </span>
            </p>
          </div>
          <p>{formatDuration(item.duration)}</p>
        </div>

        <button
          aria-label="Expand gym session"
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
