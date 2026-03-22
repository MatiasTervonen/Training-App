"use client";

import { Heart, MessageCircle, SquareArrowOutUpRight } from "lucide-react";
import { SocialFeedItem } from "@/types/social-feed";
import { useTranslation } from "react-i18next";

type Props = {
  item: SocialFeedItem;
  onToggleLike: () => void;
  onExpand: () => void;
  onOpenComments: () => void;
};

export default function SocialFeedCardFooter({ item, onToggleLike, onExpand, onOpenComments }: Props) {
  const { t } = useTranslation("social");

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700/50 mt-1">
      <button
        onClick={onToggleLike}
        className="flex items-center gap-2 cursor-pointer"
      >
        <Heart
          size={20}
          className={item.user_has_liked ? "text-red-500" : "text-slate-500"}
          fill={item.user_has_liked ? "#ef4444" : "transparent"}
        />
        {item.like_count > 0 && (
          <span className={item.user_has_liked ? "text-red-400 text-sm" : "text-slate-500 text-sm"}>
            {item.like_count}
          </span>
        )}
      </button>

      <button
        onClick={onOpenComments}
        className="flex items-center gap-2 cursor-pointer"
      >
        <MessageCircle size={18} className="text-slate-500" />
        {item.comment_count > 0 && (
          <span className="text-slate-500 text-sm">{item.comment_count}</span>
        )}
      </button>

      <button
        onClick={onExpand}
        className="flex items-center gap-2 cursor-pointer"
      >
        <SquareArrowOutUpRight size={18} className="text-slate-500" />
        <span className="text-slate-500 text-sm">{t("social.details")}</span>
      </button>
    </div>
  );
}
