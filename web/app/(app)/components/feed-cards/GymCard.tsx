import { Dumbbell, Ellipsis, SquareArrowOutUpRight } from "lucide-react";
import DropdownMenu from "../dropdownMenu";
import { formatDate } from "@/app/(app)/lib/formatDate";
import { FeedCardProps } from "@/app/(app)/types/session";

type gymPayload = {
  duration: number;
  exercises_count: number;
  sets_count: number;
};

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

export default function GymCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const payload = item.extra_fields as gymPayload;

  return (
    <div
      className={`
       border rounded-md flex flex-col  transition-colors min-h-[159px] justify-between ${
         pinned
           ? " border-yellow-200 bg-yellow-200 text-slate-900"
           : "bg-slate-700"
       }`}
    >
      <div className="flex justify-between items-center mt-2 mx-4">
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
          pinned={pinned}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>

      <div className="flex">
        <p className="ml-4">Exercises: {payload.exercises_count}</p>
        <p className="ml-4">Sets: {payload.sets_count}</p>
      </div>

      <div className="flex justify-between items-center mt-2 bg-black/40 rounded-b-md">
        {/* Icon */}

        <div className="flex items-center gap-4">
          <div className=" p-2 rounded-bl-md">
            <Dumbbell size={20} />
          </div>
          <span>Gym</span>

          {/* Date */}

          <p className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            {formatDate(item.created_at)}
          </p>

          <p>{formatDuration(payload.duration)}</p>
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
