"use client";

import { useTranslation } from "react-i18next";
import { MessageType } from "@/types/chat";

type ReplyPreviewProps = {
  senderName: string | null;
  content: string | null;
  messageType: MessageType | null;
  isDeleted: boolean;
  onClick?: () => void;
};

function getPreviewText(type: MessageType | null, content: string | null, isDeleted: boolean, t: (key: string) => string): string {
  if (isDeleted) return t("chat.messageDeleted");
  if (!type || type === "text") return content ?? "";
  switch (type) {
    case "image": return t("chat.photo");
    case "video": return t("chat.video");
    case "voice": return t("chat.voiceMessage");
    case "session_share": return t("chat.sessionShare");
    case "location": return t("chat.location");
    default: return content ?? "";
  }
}

export default function ReplyPreview({ senderName, content, messageType, isDeleted, onClick }: ReplyPreviewProps) {
  const { t } = useTranslation("chat");

  return (
    <button
      onClick={onClick}
      className="flex items-stretch gap-2 mb-1 text-left w-full rounded-md bg-slate-700/50 p-2 text-xs"
    >
      <div className="w-0.5 bg-cyan-400 rounded-full shrink-0" />
      <div className="min-w-0">
        <p className="font-body text-cyan-400 truncate">{senderName}</p>
        <p className="font-body text-gray-400 truncate">
          {getPreviewText(messageType, content, isDeleted, t)}
        </p>
      </div>
    </button>
  );
}
