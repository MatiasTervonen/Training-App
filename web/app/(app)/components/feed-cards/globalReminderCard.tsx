import { Bell, Check } from "lucide-react";
import { formatDateTime } from "@/app/(app)/lib/formatDate";
import { FeedCardProps } from "@/app/(app)/types/session";
import BaseFeedCard from "./BaseFeedCard";

type reminderPayload = {
  notify_at: string;
  delivered: boolean;
};

export default function GlobalReminderCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const payload = item.extra_fields as reminderPayload;

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<Bell size={20} className={pinned ? "text-slate-900" : "text-gray-100"} />}
      typeName="Reminder"
      showUpdatedAt={!payload.delivered}
      statsContent={
        <div className={`flex flex-col gap-2 ${pinned ? "text-slate-900" : "text-gray-100"}`}>
          <div className="flex items-center gap-2">
            <p>{formatDateTime(payload.notify_at)}</p>
            <Bell size={20} />
          </div>
          {payload.delivered && (
            <div className="flex items-center gap-2 bg-gray-900 rounded-md w-fit px-2 py-1">
              <Check size={20} className="text-green-400" />
              <p className="text-gray-100">Delivered</p>
            </div>
          )}
        </div>
      }
    />
  );
}
