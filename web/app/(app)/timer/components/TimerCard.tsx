import { formatDate } from "@/app/(app)/lib/formatDate";
import { timers } from "@/app/(app)/types/models";

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
      <div className="mx-4">
        <div className="my-5 flex flex-col gap-2 justify-center items-center">
          <h2 className="text-sm text-gray-400">
            Created: {formatDate(item.created_at)}
          </h2>
          <h2 className="text-lg text-gray-100">{item.title}</h2>
        </div>
        <div className="mt-6 bg-slate-900 rounded-md px-4 py-2 shadow-lg max-w-md mx-auto text-center">
          <p className="bg-slate-700 w-fit mx-auto px-6 py-2 rounded-md">
            {formatSeconds(item.time_seconds)}
          </p>
          <p className="mt-5 mb-2">{item.notes}</p>
        </div>
        <button
          onClick={onStarTimer}
          className="mb-5 max-w-md mx-auto mt-10 flex items-center justify-center w-full gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
        >
          Start TImer
        </button>
        <button
          onClick={onDelete}
          className="mb-5 max-w-md mx-auto mt-5 flex items-center justify-center w-full gap-2 bg-red-800 py-2 rounded-md shadow-xl border-2 border-red-500 text-gray-100 text-lg cursor-pointer hover:bg-red-700 hover:scale-95"
        >
          Delete Timer
        </button>
      </div>
    </>
  );
}
