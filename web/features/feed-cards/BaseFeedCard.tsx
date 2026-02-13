"use client";

import { Ellipsis, SquareArrowOutUpRight, Calendar } from "lucide-react";
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
  statsContent: ReactNode;
  typeIcon: ReactNode;
  typeName: string;
  showUpdatedAt?: boolean;
};

export default function BaseFeedCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
  statsContent,
  typeIcon,
  typeName,
  showUpdatedAt = false,
}: BaseCardProps) {
  const { t } = useTranslation("feed");
  return (
    <div
      className={`
        border rounded-md flex flex-col justify-between transition-colors min-h-[170px] overflow-hidden ${
          pinned
            ? "border-yellow-200 bg-yellow-400"
            : "bg-slate-700 border-gray-100"
        }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mt-2 mx-4">
        <div
          className={`flex-1 mr-8 underline text-lg line-clamp-1 ${
            pinned ? "text-slate-900" : "text-gray-100"
          }`}
        >
          {item.title}
        </div>
        <DropdownMenu
          button={
            <div
              aria-label="More options"
              className={`cursor-pointer ${
                pinned ? "text-slate-900" : "text-gray-100"
              }`}
            >
              <Ellipsis size={20} />
            </div>
          }
          pinned={pinned}
          onEdit={onEdit}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      </div>

      {/* Middle content - always centered */}
      <div className="flex-1 flex items-center font-body">
        <div className="flex items-center justify-start ml-4">
          {statsContent}
        </div>
      </div>

      {/* Updated timestamp (optional) */}
      {showUpdatedAt &&
        (item.updated_at ? (
          <p
            className={`ml-4 text-sm ${
              pinned ? "text-slate-900" : "text-yellow-500"
            }`}
          >
            {t("feed.card.updated")} {formatDate(item.updated_at)}
          </p>
        ) : (
          <p className="min-h-5"></p>
        ))}

      {/* Footer */}
      <div className="flex justify-between items-center mt-2 bg-slate-950/40 rounded-b-md">
        <div className="flex items-center gap-2 pl-2">
          {typeIcon}
          <span className={pinned ? "text-slate-900" : "text-gray-100"}>
            {typeName}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <Calendar
            size={20}
            className={pinned ? "text-slate-900" : "text-gray-100"}
          />
          <span className={pinned ? "text-slate-900" : "text-gray-100"}>
            {formatDateShort(item.created_at)}
          </span>
        </div>

        <button
          aria-label={t("feed.card.details")}
          onClick={onExpand}
          className="bg-blue-700 text-gray-100 py-2 px-4 rounded-br-md hover:bg-blue-600 cursor-pointer flex items-center gap-2"
        >
          <span>{t("feed.card.details")}</span>
          <SquareArrowOutUpRight size={20} />
        </button>
      </div>
    </div>
  );
}
