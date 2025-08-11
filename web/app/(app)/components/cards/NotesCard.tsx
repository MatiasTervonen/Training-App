import { NotebookPen, Ellipsis, SquareArrowOutUpRight } from "lucide-react";
import DropdownMenu from "../dropdownMenu";
import { formatDate } from "@/app/(app)/lib/formatDate";
import { feed_view } from "@/app/(app)/types/session";

type Props = {
  item: feed_view;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function NotesCard({
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
       border rounded-md flex flex-col justify-center mb-2 transition-colors ${
         pinned
           ? `border-yellow-200 bg-yellow-200 text-slate-900`
           : "bg-slate-700"
       }`}
    >
      <div className="flex justify-between items-center mt-2 mb-4 mx-4">
        <div className="line-clamp-1 border-b">{item.title}</div>
        <DropdownMenu
          button={
            <div
              aria-label="More options"
              className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              <Ellipsis size={20} />
            </div>
          }
        >
          <button
            aria-label="Edit note"
            onClick={() => {
              onEdit();
            }}
            className="border-b py-2 px-4"
          >
            Edit
          </button>
          <button
            aria-label="Pin or unpin note"
            onClick={() => {
              onTogglePin();
            }}
            className="border-b py-2 px-4"
          >
            {pinned ? "Unpin" : "Pin"}
          </button>
          <button
            aria-label="Delete note"
            onClick={() => {
              onDelete();
            }}
            className="py-2 px-4"
          >
            Delete
          </button>
        </DropdownMenu>
      </div>

      <div className="ml-4 mb-4 mr-5 line-clamp-2">{item.notes}</div>
      <div className="flex justify-between items-center mt-2 bg-black/40 rounded-b-md">
        {/* Icon */}

        <div className="flex items-center gap-4">
          <div className="pl-2">
            <NotebookPen size={20} />
          </div>
          <span>Notes</span>

          {/* Date */}

          <div>
            <p className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
              {formatDate(item.created_at!)}
            </p>
          </div>
        </div>

        <button
          aria-label="Expand note"
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
