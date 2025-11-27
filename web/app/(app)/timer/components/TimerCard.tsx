import { formatDate } from "@/app/(app)/lib/formatDate";
import { timers } from "@/app/(app)/types/models";
import DeleteSessionBtn from "../../ui/deleteSessionBtn";
import BaseButton from "../../ui/BaseButton";

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
      <div className="max-w-lg mx-auto flex flex-col gap-10 h-full page-padding justify-between ">
        <div className="flex flex-col">
          <h2 className="text-sm text-gray-400 text-center">
            Created: {formatDate(item.created_at)}
          </h2>
          <h2 className="text-xl mt-5 mb-10 text-center">{item.title}</h2>
          <div className="bg-slate-900 rounded-md px-4 shadow-md flex flex-col items-center py-10">
            <p className="bg-slate-600 w-fit mx-auto px-6 py-2 rounded-md text-lg ">
              {formatSeconds(item.time_seconds)}
            </p>
            {item.notes && <p className="mt-5 mb-2">{item.notes}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-5 mb-10">
          <BaseButton onClick={onStarTimer} label="Start TImer" />

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
