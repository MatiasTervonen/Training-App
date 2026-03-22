"use client";

import { memo } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { FeedComment } from "@/types/social-feed";
import { useTranslation } from "react-i18next";

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return `${Math.floor(diffDay / 7)}w`;
}

type CommentItemProps = {
  comment: FeedComment;
  isOwnComment: boolean;
  onDelete: () => void;
  onReply: () => void;
};

function CommentItem({
  comment,
  isOwnComment,
  onDelete,
  onReply,
}: CommentItemProps) {
  const { t } = useTranslation(["social", "common"]);
  const isReply = !!comment.parent_id;

  const handleDelete = () => {
    if (window.confirm(t("social:social.deleteComment"))) {
      onDelete();
    }
  };

  return (
    <div className={`flex gap-3 py-3 ${isReply ? "pl-12 pr-4" : "px-4"}`}>
      {comment.author_profile_picture ? (
        <Image
          src={comment.author_profile_picture}
          alt={comment.author_display_name}
          width={isReply ? 28 : 36}
          height={isReply ? 28 : 36}
          className={`rounded-full bg-slate-600 object-cover ${isReply ? "w-7 h-7" : "w-9 h-9"}`}
        />
      ) : (
        <div
          className={`rounded-full bg-slate-600 flex items-center justify-center shrink-0 ${isReply ? "w-7 h-7" : "w-9 h-9"}`}
        >
          <span
            className={`text-gray-300 ${isReply ? "text-xs" : "text-sm"}`}
          >
            {comment.author_display_name?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-100">{comment.author_display_name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {getRelativeTime(comment.created_at)}
            </span>
            {isOwnComment && (
              <button onClick={handleDelete} className="cursor-pointer">
                <Trash2 size={14} className="text-slate-500 hover:text-red-400" />
              </button>
            )}
          </div>
        </div>
        <p className="text-[13px] text-slate-400 mt-1 leading-5 font-body">
          {isReply && comment.reply_to_display_name && (
            <span className="text-sm text-blue-400">
              @{comment.reply_to_display_name}{" "}
            </span>
          )}
          {comment.content}
        </p>
        {!isReply && (
          <button onClick={onReply} className="mt-1.5 cursor-pointer">
            <span className="text-xs text-slate-500 hover:text-slate-400">
              {t("social:social.reply")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(CommentItem);
