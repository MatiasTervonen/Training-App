import { reminders } from "../../types/models";
import DropdownMenu from "../dropdownMenu";
import { Bell, Ellipsis } from "lucide-react";
import { formatDate } from "../../lib/formatDate";

type Props = {
  item: reminders;
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
  return (
    <div className="border border-gray-700 rounded-md justify-center bg-slate-900 mb-10">
      <div className="flex justify-between items-center mb-4 mt-2 mx-4">
        <h1 className="mr-4 text-lg flex-1 line-clamp-2">{item.title}</h1>
        <DropdownMenu
          button={
            <div aria-label="More options" className="cursor-pointer">
              <Ellipsis size={20} />
            </div>
          }
        >
          <button
            aria-label="Edit gym session"
            onClick={() => {
              onEdit(index);
            }}
            className="border-b py-2 px-4 hover:bg-gray-600"
          >
            Edit
          </button>
          <button
            aria-label="Delete gym session"
            onClick={() => {
              onDelete(index);
            }}
            className="py-2 px-4 hover:bg-gray-600"
          >
            Delete
          </button>
        </DropdownMenu>
      </div>
      <p className="ml-4 mb-2 text-gray-400 text-sm">
        created at {formatDate(item.created_at)}
      </p>
      <button
        aria-label="Expand gym session"
        onClick={onExpand}
        className="flex items-center gap-5 justify-center w-full  px-5 bg-blue-600 p-2 rounded-br-md rounded-bl-md cursor-pointer"
      >
        <p>Expand</p>
        <Bell size={20} color="#f3f4f6" />
      </button>
    </div>
  );
}
