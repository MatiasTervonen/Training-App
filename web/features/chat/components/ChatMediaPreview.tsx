"use client";

import { X, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDurationMs } from "@/lib/chat/upload-chat-media";

type ChatMediaPreviewProps = {
  type: "image" | "video" | "voice";
  previewUrl: string;
  durationMs?: number;
  onCancel: () => void;
};

export default function ChatMediaPreview({ type, previewUrl, durationMs, onCancel }: ChatMediaPreviewProps) {
  const { t } = useTranslation("chat");

  return (
    <div className="flex items-center gap-3 px-4 pt-3">
      <button
        onClick={onCancel}
        className="p-1 hover:bg-slate-700 rounded-full shrink-0"
      >
        <X size={16} className="text-gray-400" />
      </button>

      {type === "voice" ? (
        <div className="flex items-center gap-2">
          <Mic size={18} className="text-cyan-400" />
          <span className="font-body text-sm text-slate-300">
            {t("chat.voiceMessage")} {durationMs ? formatDurationMs(durationMs) : ""}
          </span>
        </div>
      ) : (
        <div className="relative">
          {type === "image" ? (
            <img
              src={previewUrl}
              alt=""
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <video
              src={previewUrl}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          {durationMs && type === "video" && (
            <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded px-1">
              <span className="font-body text-[10px] text-white">{formatDurationMs(durationMs)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
