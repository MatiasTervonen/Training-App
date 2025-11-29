import { ListTodo, Ellipsis, SquareArrowOutUpRight } from "lucide-react";
import DropdownMenu from "../dropdownMenu";
import { formatDate } from "@/app/(app)/lib/formatDate";
import { todo_lists } from "../../types/models";
import { useQuery } from "@tanstack/react-query";
import { full_todo_session } from "../../types/models";
import { getFullTodoSession } from "../../database/todo";

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
  const { data: fullTodo } = useQuery<full_todo_session>({
    queryKey: ["fullTodoSession", item.id],
    queryFn: () => getFullTodoSession(item.id),
    enabled: false,
  });

  const total = fullTodo?.todo_tasks.length;

  const completed = fullTodo
    ? fullTodo.todo_tasks.filter((t) => t.is_completed).length
    : 0;

  return (
    <div
      className={`
       border rounded-md flex flex-col justify-between transition-colors min-h-[159px] ${
         pinned
           ? `border-yellow-200 bg-yellow-200 text-slate-900`
           : "bg-slate-700"
       }`}
    >
      <div className="flex flex-col justify-between flex-1">
        <div className="flex justify-between items-center mt-2  mx-4">
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

        {fullTodo && (
          <p className={`ml-4 ${pinned ? "text-slate-900" : "text-gray-100"}`}>
            completed: {completed} / {total}
          </p>
        )}

        {item.updated_at ? (
          <p
            className={`text-sm ml-4 min-h-5 ${
              pinned ? "text-slate-900" : "text-yellow-500"
            } `}
          >
            updated: {formatDate(item.updated_at)}
          </p>
        ) : (
          <p className="min-h-5 invisible"></p>
        )}
      </div>

      <div className="flex justify-between items-center mt-2 bg-black/40 rounded-b-md">
        <div className="flex items-center gap-4">
          <div className="pl-2">
            <ListTodo size={20} />
          </div>
          <span>Todo</span>

          <div>
            <p className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
              {formatDate(item.created_at)}
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
