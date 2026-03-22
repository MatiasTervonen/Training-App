"use client";

import { Ellipsis, SquareArrowOutUpRight } from "lucide-react";
import DropdownMenu from "@/components/dropdownMenu";
import { formatDate, formatDateShort } from "@/lib/formatDate";
import { FeedCardProps } from "@/types/session";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type BaseCardProps = {
  item: FeedCardProps["item"];
  pinned: boolean;
  onTogglePin: () => void;
  onDelete?: () => void;
  onExpand: () => void;
  onEdit?: () => void;
  onMoveToFolder?: () => void;
  onHide?: () => void;
  statsContent: ReactNode;
  typeIcon: ReactNode;
  typeName: string;
  showUpdatedAt?: boolean;
};

function getCardGradientClass(type: string): string {
  switch (type) {
    case "gym_sessions":
      return "card-gym";
    case "activity_sessions":
      return "card-activity";
    case "notes":
      return "card-notes";
    case "weight":
      return "card-weight";
    case "todo_lists":
      return "card-todo";
    case "global_reminders":
    case "local_reminders":
      return "card-reminder";
    case "habits":
      return "card-habits";
    case "reports":
      return "card-reports";
    case "tutorial":
      return "card-tutorial";
    default:
      return "card-default";
  }
}

export default function BaseFeedCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
  onMoveToFolder,
  onHide,
  statsContent,
  typeIcon,
  typeName,
  showUpdatedAt = false,
}: BaseCardProps) {
  const { t } = useTranslation("feed");
  const gradientClass = pinned ? "card-pinned" : getCardGradientClass(item.type);

  return (
    <div className="shadow-sm shadow-black/50 rounded-md">
      <div
        className={`
          border rounded-md flex flex-col justify-between transition-colors min-h-[160px] overflow-hidden ${gradientClass} ${
            pinned ? "border-yellow-400/70" : "border-slate-700"
          }`}
      >
        {/* Header - title + menu */}
        <div className="flex justify-between items-center px-4 pt-2 pb-1">
          <div className="flex-1 mr-4 text-lg line-clamp-1 text-gray-100">
            {item.title}
          </div>
          <DropdownMenu
            button={
              <div
                aria-label="More options"
                className="cursor-pointer text-slate-400"
              >
                <Ellipsis size={20} />
              </div>
            }
            pinned={pinned}
            onEdit={onEdit}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
            onMoveToFolder={onMoveToFolder}
            onHide={onHide}
          />
        </div>

        {/* Stats content */}
        <div className="flex-1 flex items-center font-body px-4 pb-2">
          {statsContent}
        </div>

        {/* Updated timestamp (optional) */}
        {showUpdatedAt && item.updated_at && (
          <div className="px-4 pb-1">
            <p className="text-sm font-body text-slate-400">
              {t("feed.card.updated")} {formatDate(item.updated_at)}
            </p>
          </div>
        )}

        {/* Footer - type, date, details */}
        <div className="flex items-center justify-between bg-slate-900/40 px-4 py-2">
          <div className="flex items-center gap-2">
            {typeIcon}
            <span className="text-slate-400 text-sm">{typeName}</span>
            <span className="text-slate-500 text-sm">·</span>
            <span className="text-slate-400 text-sm">
              {formatDateShort(item.created_at)}
            </span>
          </div>
          <button
            aria-label={t("feed.card.details")}
            onClick={onExpand}
            className="flex items-center gap-2 cursor-pointer"
          >
            <SquareArrowOutUpRight size={18} className="text-slate-500" />
            <span className="text-slate-500 text-sm">
              {t("feed.card.details")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
