"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Check, CheckCheck, Dumbbell, Activity, MapPin } from "lucide-react";
import { ChatMessage, LocationShareContent, SessionShareContent } from "@/types/chat";
import ReplyPreview from "@/features/chat/components/ReplyPreview";
import ReactionPills from "@/features/chat/components/ReactionPills";
import LinkPreviewCard from "@/features/chat/components/LinkPreviewCard";
import MessageContextMenu from "@/features/chat/components/MessageContextMenu";
import ChatMediaBubble from "@/features/chat/components/ChatMediaBubble";
import ChatLocationCard from "@/features/chat/components/ChatLocationCard";

type ChatBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  showReadReceipt: boolean;
  onReply: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onForward: () => void;
  onScrollToMessage?: (messageId: string) => void;
  onSessionPress?: (data: SessionShareContent, conversationId: string) => void;
};

type SessionShareData = SessionShareContent;

function formatDuration(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function getTranslatedActivityName(
  activityName: string | undefined,
  tActivities: (key: string, options?: Record<string, string>) => string,
  fallback: string,
): string {
  if (!activityName) return fallback;
  const slug = activityName.toLowerCase().replace(/\s+/g, "_");
  const key = `activities.activityNames.${slug}`;
  const translated = tActivities(key, { defaultValue: "" });
  if (translated && translated !== key) return translated;
  return activityName;
}

function SessionShareCard({
  data,
  t,
  tActivities,
  onClick,
}: {
  data: SessionShareData;
  t: (key: string) => string;
  tActivities: (key: string, options?: Record<string, string>) => string;
  onClick?: () => void;
}) {
  const isGym = data.session_type === "gym_sessions";

  return (
    <div
      onClick={onClick}
      className={`rounded-xl overflow-hidden border border-slate-600/50 w-[280px] ${onClick ? "cursor-pointer hover:brightness-110 transition-all" : ""} ${
        isGym
          ? "bg-linear-to-br from-blue-500/15 to-blue-500/5"
          : "bg-linear-to-br from-green-500/15 to-green-500/5"
      }`}
    >
      <div className="px-4 pt-3.5 pb-3">
        {/* Category */}
        <div className="flex items-center gap-2 mb-2.5">
          {isGym ? (
            <Dumbbell size={16} className="text-slate-400" />
          ) : (
            <Activity size={16} className="text-slate-400" />
          )}
          <span className="font-body text-sm text-slate-400">
            {isGym
              ? t("chat.gymSession")
              : getTranslatedActivityName(data.activity_name, tActivities, t("chat.activitySession"))}
          </span>
        </div>

        {/* Title */}
        <p className="text-lg truncate mb-3">{data.title}</p>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {data.stats.duration > 0 && (
            <div className="flex flex-col items-center">
              <span className="font-body text-base">
                {formatDuration(data.stats.duration)}
              </span>
              <span className="font-body text-[10px] text-slate-400">
                {t("chat.duration")}
              </span>
            </div>
          )}
          {isGym && data.stats.exercises_count > 0 && (
            <div className="flex flex-col items-center">
              <span className="font-body text-base">
                {data.stats.exercises_count}
              </span>
              <span className="font-body text-[10px] text-slate-400">
                {t("chat.exercises")}
              </span>
            </div>
          )}
          {isGym && data.stats.sets_count > 0 && (
            <div className="flex flex-col items-center">
              <span className="font-body text-base">
                {data.stats.sets_count}
              </span>
              <span className="font-body text-[10px] text-slate-400">
                {t("chat.sets")}
              </span>
            </div>
          )}
          {isGym && (data.stats.total_volume ?? 0) > 0 && (
            <div className="flex flex-col items-center">
              <span className="font-body text-base">
                {Math.round(data.stats.total_volume)}
              </span>
              <span className="font-body text-[10px] text-slate-400">
                {t("chat.volume")}
              </span>
            </div>
          )}
          {!isGym && data.stats.distance_meters > 0 && (
            <div className="flex flex-col items-center">
              <span className="font-body text-base">
                {(data.stats.distance_meters / 1000).toFixed(1)}km
              </span>
              <span className="font-body text-[10px] text-slate-400">
                {t("chat.distance")}
              </span>
            </div>
          )}
          {!isGym && data.stats.calories > 0 && (
            <div className="flex flex-col items-center">
              <span className="font-body text-base">
                {Math.round(data.stats.calories)}
              </span>
              <span className="font-body text-[10px] text-slate-400">
                {t("chat.calories")}
              </span>
            </div>
          )}
        </div>

        {/* Tap to view hint */}
        {onClick && (
          <div className="flex items-center justify-start mt-2.5 gap-0.5">
            <span className="font-body text-xs text-slate-500">
              {t("chat.tapToView")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageContent({
  message,
  isOwn,
  t,
  tActivities,
  onSessionPress,
}: {
  message: ChatMessage;
  isOwn: boolean;
  t: (key: string) => string;
  tActivities: (key: string, options?: Record<string, string>) => string;
  onSessionPress?: (data: SessionShareContent, conversationId: string) => void;
}) {
  if (message.message_type === "text") {
    return (
      <p className="font-body text-sm whitespace-pre-wrap wrap-break-words">
        {message.content}
      </p>
    );
  }

  if (message.message_type === "session_share") {
    let data: SessionShareData | null = null;
    try {
      data = JSON.parse(message.content ?? "{}");
    } catch {
      // invalid JSON — fall through to fallback
    }

    if (data) {
      return (
        <SessionShareCard
          data={data}
          t={t}
          tActivities={tActivities}
          onClick={onSessionPress ? () => onSessionPress(data, message.conversation_id) : undefined}
        />
      );
    }

    return (
      <p className="font-body text-sm text-gray-500 italic">
        {t("chat.sessionShare")}
      </p>
    );
  }

  if (
    message.message_type === "image" ||
    message.message_type === "video" ||
    message.message_type === "voice"
  ) {
    return <ChatMediaBubble message={message} isOwn={isOwn} />;
  }

  if (message.message_type === "location") {
    let locationData: LocationShareContent | null = null;
    try {
      locationData = JSON.parse(message.content ?? "{}");
    } catch {
      // invalid JSON
    }

    if (locationData && locationData.lat != null && locationData.lng != null) {
      return <ChatLocationCard data={locationData} />;
    }

    return (
      <div className="flex items-center gap-2 font-body text-sm text-gray-400">
        <MapPin size={16} />
        <span>{t("chat.location")}</span>
      </div>
    );
  }

  return (
    <p className="font-body text-sm text-gray-500 italic">
      {t("chat.unsupportedType")}
    </p>
  );
}

export default function ChatBubble({
  message,
  isOwn,
  showReadReceipt,
  onReply,
  onDelete,
  onReact,
  onForward,
  onScrollToMessage,
  onSessionPress,
}: ChatBubbleProps) {
  const { t } = useTranslation("chat");
  const { t: tActivities } = useTranslation("activities");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const isDeleted = !!message.deleted_at;
  const isSessionShare = message.message_type === "session_share";
  const isLocation = message.message_type === "location";
  const isMedia =
    message.message_type === "image" || message.message_type === "video";
  const hasTextContent = message.message_type === "text" && !!message.content;
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      const rect = bubbleRef.current?.getBoundingClientRect();
      if (rect) {
        setContextMenu({ x: rect.left + rect.width / 2, y: rect.top });
      }
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  const handleCopy = useCallback(() => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
  }, [message.content]);

  return (
    <div
      className={`flex flex-col ${isOwn ? "items-end" : "items-start"} px-4`}
    >
      <div
        ref={bubbleRef}
        id={`msg-${message.id}`}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        className={`max-w-[80%] rounded-2xl transition-all duration-200 ${
          contextMenu ? "ring-2 ring-cyan-400/50 scale-[1.02]" : ""
        } ${
          isDeleted
            ? "px-3 py-1.5 bg-slate-800/50"
            : isSessionShare || isMedia || isLocation
              ? "p-0 overflow-hidden"
              : isOwn
                ? "px-3 py-1.5 bg-cyan-800 rounded-br-sm"
                : "px-3 py-1.5 bg-slate-700 rounded-bl-sm"
        }`}
      >
        {/* Reply preview */}
        {message.reply_to_message_id && !isDeleted && (
          <ReplyPreview
            senderName={message.reply_to_sender_name}
            content={message.reply_to_content}
            messageType={message.reply_to_message_type}
            isDeleted={!!message.reply_to_deleted_at}
            onClick={() => onScrollToMessage?.(message.reply_to_message_id!)}
          />
        )}

        {/* Message content */}
        {isDeleted ? (
          <p className="font-body text-sm text-gray-500 italic">
            {t("chat.messageDeleted")}
          </p>
        ) : (
          <MessageContent message={message} isOwn={isOwn} t={t} tActivities={tActivities} onSessionPress={onSessionPress} />
        )}

        {/* Link preview */}
        {message.link_preview && !isDeleted && (
          <div className="mt-2">
            <LinkPreviewCard preview={message.link_preview} />
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className={`${isOwn ? "self-end" : "self-start"} px-3`}>
        <ReactionPills reactions={message.reactions} onToggle={onReact} />
      </div>

      {/* Timestamp + read receipt */}
      <div
        className={`flex items-center gap-1 px-3 mt-0.5 ${isOwn ? "self-end" : "self-start"}`}
      >
        <span
          className={`font-body text-xs ${isOwn ? "text-cyan-200/60" : "text-slate-400/70"}`}
        >
          {time}
        </span>
        {isOwn &&
          !isDeleted &&
          (showReadReceipt ? (
            <CheckCheck size={14} className="text-cyan-300" />
          ) : (
            <Check size={14} className="text-slate-400" />
          ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOwn={isOwn}
          isDeleted={isDeleted}
          hasTextContent={hasTextContent}
          onClose={() => setContextMenu(null)}
          onReply={onReply}
          onCopy={handleCopy}
          onForward={onForward}
          onDelete={onDelete}
          onReact={onReact}
        />
      )}
    </div>
  );
}
