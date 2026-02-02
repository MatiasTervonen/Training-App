import { NotebookPen } from "lucide-react";
import { FeedCardProps } from "@/app/(app)/types/session";
import BaseFeedCard from "./BaseFeedCard";

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
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<NotebookPen size={20} className={pinned ? "text-slate-900" : "text-gray-100"} />}
      typeName="Notes"
      showUpdatedAt={true}
      statsContent={
        <p
          className={`line-clamp-2 break-words ${
            pinned ? "text-slate-900" : "text-gray-100"
          }`}
        >
          {payload.notes}
        </p>
      }
    />
  );
}
