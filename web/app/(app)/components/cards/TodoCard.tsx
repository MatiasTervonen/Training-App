import { ListTodo, Ellipsis, SquareArrowOutUpRight } from "lucide-react";
import DropdownMenu from "../dropdownMenu";
import { formatDate } from "@/app/(app)/lib/formatDate";
import { todo_lists } from "../../types/models";

type Props = {
  item: todo_lists;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function TodoCard({
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
       border rounded-md flex flex-col justify-center transition-colors ${
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
              className={`cursor-pointer  ${
                pinned ? "text-slate-900" : "text-gray-100"
              }`}
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
            className="border-b py-2 px-4 hover:bg-gray-600"
          >
            Edit
          </button>
          <button
            aria-label="Pin or unpin note"
            onClick={() => {
              onTogglePin();
            }}
            className="border-b py-2 px-4 hover:bg-gray-600"
          >
            {pinned ? "Unpin" : "Pin"}
          </button>
          <button
            aria-label="Delete note"
            onClick={() => {
              onDelete();
            }}
            className="py-2 px-4 hover:bg-gray-600"
          >
            Delete
          </button>
        </DropdownMenu>
      </div>

      <div className="flex justify-between items-center mt-2 bg-black/40 rounded-b-md">
        {/* Icon */}

        <div className="flex items-center gap-4">
          <div className="pl-2">
            <ListTodo size={20} />
          </div>
          <span>Todo</span>

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
