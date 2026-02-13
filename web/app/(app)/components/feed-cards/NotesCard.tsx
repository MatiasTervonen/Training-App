"use client";

import { NotebookPen } from "lucide-react";
import { FeedCardProps } from "@/app/(app)/types/session";
import BaseFeedCard from "./BaseFeedCard";
import { useTranslation } from "react-i18next";

type notesPayload = {
  notes: string;
};

function stripForPreview(content: string): string {
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function NotesCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
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
      typeName={t("feed.card.types.notes")}
      showUpdatedAt={true}
      statsContent={
        <p
          className={`line-clamp-2 wrap-break-words ${
            pinned ? "text-slate-900" : "text-gray-100"
          }`}
        >
          {stripForPreview(payload.notes)}
        </p>
      }
    />
  );
}
