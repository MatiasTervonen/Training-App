"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Conversation, MessageType } from "@/types/chat";

function getMessagePreview(
  type: MessageType | null,
  content: string | null,
  t: (key: string) => string
): string {
  if (!type) return "";
  switch (type) {
    case "image":
      return t("chat.photo");
    case "video":
      return t("chat.video");
    case "voice":
      return t("chat.voiceMessage");
    case "session_share":
      return t("chat.sessionShare");
    case "location":
      return t("chat.location");
    default:
      return content ?? "";
  }
}

function formatTimestamp(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (msgDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (msgDate.getTime() === yesterday.getTime()) {
    return t("chat.yesterday");
  }
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

type ConversationItemProps = {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  currentUserId: string;
};

export default function ConversationItem({
  conversation,
  isActive,
  onClick,
  currentUserId,
}: ConversationItemProps) {
  const { t } = useTranslation("chat");

  const preview = getMessagePreview(
    conversation.last_message_type,
    conversation.last_message_content,
    t
  );

  const isOwnLastMessage =
    conversation.last_message_sender_id === currentUserId;
  const displayPreview = isOwnLastMessage
    ? `${t("chat.you")}: ${preview}`
    : preview;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
        isActive
          ? "bg-slate-800"
          : "hover:bg-slate-800"
      }`}
    >
      <Image
        src={conversation.other_user_profile_picture || "/default-avatar.png"}
        alt={conversation.other_user_display_name || ""}
        width={40}
        height={40}
        className="rounded-full w-10 h-10 shrink-0 object-cover"
      />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm">
            {conversation.other_user_display_name}
          </span>
          {conversation.last_message_at && (
            <span className="text-xs text-gray-400 shrink-0 ml-2">
              {formatTimestamp(conversation.last_message_at, t)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-gray-400 truncate">
            {displayPreview}
          </span>
          {conversation.unread_count > 0 && (
            <span className="bg-blue-500 text-white rounded-full text-xs min-w-5 h-5 flex items-center justify-center px-1 shrink-0 ml-2">
              {conversation.unread_count > 9
                ? "9+"
                : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
