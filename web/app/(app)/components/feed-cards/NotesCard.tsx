import { NotebookPen, Ellipsis, SquareArrowOutUpRight } from "lucide-react";
import DropdownMenu from "../dropdownMenu";
import { formatDate } from "@/app/(app)/lib/formatDate";
import { FeedCardProps } from "@/app/(app)/types/session";

type notesPayload = {
  notes: string;
};

export default function NotesCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const payload = item.extra_fields as notesPayload;

  return (
    <div
      className={`
       border rounded-md flex flex-col justify-between transition-colors min-h-[159px]  ${
         pinned
           ? `border-yellow-200 bg-yellow-200 text-slate-900`
           : "bg-slate-700"
       }`}
    >
      <div className="flex flex-col justify-between flex-1">
        <div className="flex justify-between items-center mt-2 mx-4">
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

        <div className="ml-4  mr-5 line-clamp-2 wrap-break-word">
          {payload.notes}
        </div>

        {item.updated_at ? (
          <p
            className={`ml-4 text-sm ${
              pinned ? "text-slate-900" : "text-yellow-500"
            }`}
          >
            updated: {formatDate(item.updated_at)}
          </p>
        ) : (
          <p className="invisible"></p>
        )}
      </div>

      <div className="flex justify-between items-center mt-2 bg-black/40 rounded-b-md">
        {/* Icon */}

        <div className="flex items-center gap-4">
          <div className="pl-2">
            <NotebookPen size={20} />
          </div>
          <span>Notes</span>

          {/* Date */}

          <p className={` ${pinned ? "text-slate-900" : "text-gray-100"}`}>
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
