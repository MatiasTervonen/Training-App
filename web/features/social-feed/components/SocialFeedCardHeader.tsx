"use client";

import { SocialFeedItem } from "@/types/social-feed";
import { ReactNode } from "react";
import { X } from "lucide-react";

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

type Props = {
  item: SocialFeedItem;
  typeIcon?: ReactNode;
  onClose?: () => void;
};

export default function SocialFeedCardHeader({ item, typeIcon, onClose }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      {item.author_profile_picture ? (
        <img
          src={item.author_profile_picture}
          alt={item.author_display_name}
          className="w-10 h-10 rounded-full bg-slate-600 object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
          <span className="text-base text-gray-300">
            {item.author_display_name?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-gray-100">
          {item.author_display_name}
        </p>
        {typeIcon && (
          <div className="flex items-center gap-1.5">
            {typeIcon}
          </div>
        )}
      </div>
      <span className="text-gray-400 text-sm">
        {getRelativeTime(item.created_at)}
      </span>
      {onClose && (
        <button onClick={onClose} className="cursor-pointer ml-1">
          <X size={22} className="text-slate-400 hover:text-gray-100" />
        </button>
      )}
    </div>
  );
}
