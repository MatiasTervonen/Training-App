"use client";

import { NotebookPen, FolderOpen } from "lucide-react";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type notesPayload = {
  notes: string;
  folder_id?: string | null;
};

type Props = FeedCardProps & {
  onMoveToFolder?: () => void;
  folderName?: string | null;
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
  onMoveToFolder,
  folderName,
}: Props) {
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
      onMoveToFolder={onMoveToFolder}
      typeIcon={
        <NotebookPen
          size={20}
          className={pinned ? "text-slate-900" : "text-slate-300"}
        />
      }
      typeName={t("feed.card.types.notes")}
      showUpdatedAt={true}
      statsContent={
        <div>
          {folderName && (
            <div className="flex items-center gap-1 mb-1">
              <FolderOpen size={12} className="text-slate-400" />
              <span className="text-xs text-slate-400">{folderName}</span>
            </div>
          )}
          <p
            className={`line-clamp-2 wrap-break-words ${
              pinned ? "text-slate-900" : "text-slate-300"
            }`}
          >
            {stripForPreview(payload.notes)}
          </p>
        </div>
      }
    />
  );
}
