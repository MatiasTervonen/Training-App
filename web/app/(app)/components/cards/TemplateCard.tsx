import { formatDate } from "@/app/(app)/lib/formatDate";
import DropdownMenu from "../dropdownMenu";
import { Dumbbell, Ellipsis } from "lucide-react";

type templateSummary = {
  id: string;
  name: string;
  created_at: string;
};

type Props = {
  item: templateSummary;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function TemplateCard({
  item,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  return (
    <div className="border rounded-md flex flex-col justify-center transition-colors bg-slate-900 mb-10">
      <div className=" flex justify-between items-center my-4 mx-4">
        <div className="mr-8 line-clamp-1 text-lg">{item.name}</div>
        <DropdownMenu
          button={
            <div
              aria-label="More options"
              className="flex items-center justify-center rounded-tr-md text-gray-100"
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
      <div className="ml-4 mb-2 text-gray-400 text-sm">
        created at {formatDate(item.created_at)}
      </div>
      <button
        aria-label="Expand gym session"
        onClick={onExpand}
        className="flex items-center gap-5 justify-center  px-5 bg-blue-600 text-gray-100 p-2 rounded-br-md rounded-bl-md hover:bg-blue-500  w-full cursor-pointer"
      >
        <p>start</p>
        <span>
          <Dumbbell size={20} />
        </span>
      </button>
    </div>
  );
}
