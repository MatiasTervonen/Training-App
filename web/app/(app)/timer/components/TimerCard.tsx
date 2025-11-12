import { formatDate } from "@/app/(app)/lib/formatDate";
import { timers } from "@/app/(app)/types/models";
import DeleteSessionBtn from "../../ui/deleteSessionBtn";

type Props = {
  item: timers;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
  onStarTimer: () => void;
};

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export default function TimerCard({ item, onDelete, onStarTimer }: Props) {
  return (
    <>
      <div className="max-w-md mx-auto flex flex-col gap-10 h-full">
        <div className="mt-10 flex flex-col gap-2 justify-center items-center">
          <h2 className="text-sm text-gray-400">
            Created: {formatDate(item.created_at)}
          </h2>
          <h2 className="text-xl text-gray-100">{item.title}</h2>
        </div>
        <div className="bg-slate-900 rounded-md px-4 shadow-md flex flex-col items-center py-10">
          <p className="bg-slate-600 w-fit mx-auto px-6 py-2 rounded-md text-lg ">
            {formatSeconds(item.time_seconds)}
          </p>
          {item.notes && <p className="mt-5 mb-2">{item.notes}</p>}
        </div>
        <div className="flex flex-col gap-5 mb-10">
          <button
            onClick={onStarTimer}
            className="w-full gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200"
          >
            Start TImer
          </button>
          <DeleteSessionBtn
            onDelete={onDelete}
            label="Delete Timer"
            confirmMessage="Are you sure you want to delete this timer? This action cannot be undone."
          />
        </div>
      </div>
    </>
  );
}
