"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { useMessages } from "@/features/chat/hooks/useMessages";
import { useChatRealtime } from "@/features/chat/hooks/useChatRealtime";
import { useTypingIndicator } from "@/features/chat/hooks/useTypingIndicator";
import { useMarkRead } from "@/features/chat/hooks/useMarkRead";
import { useSendMessage } from "@/features/chat/hooks/useSendMessage";
import { useSendMediaMessage } from "@/features/chat/hooks/useSendMediaMessage";
import { useDeleteMessage } from "@/features/chat/hooks/useDeleteMessage";
import { useToggleReaction } from "@/features/chat/hooks/useToggleReaction";
import { useForwardMessage } from "@/features/chat/hooks/useForwardMessage";
import { useOtherLastRead } from "@/features/chat/hooks/useOtherLastRead";
import { useCurrentUserId } from "@/features/chat/hooks/useCurrentUserId";
import ChatBubble from "@/features/chat/components/ChatBubble";
import ChatInput from "@/features/chat/components/ChatInput";
import DateSeparator from "@/features/chat/components/DateSeparator";
import TypingIndicator from "@/features/chat/components/TypingIndicator";
import FriendPickerModal from "@/features/chat/components/FriendPickerModal";
import toast from "react-hot-toast";

type ChatViewProps = {
  conversationId: string;
  otherUser: {
    id: string;
    display_name: string;
    profile_picture: string | null;
  };
  isActive: boolean;
  onBack?: () => void;
};

export default function ChatView({ conversationId, otherUser, isActive, onBack }: ChatViewProps) {
  const { t } = useTranslation("chat");
  const currentUserId = useCurrentUserId();
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Hooks
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
  const { isOtherTyping, sendTyping, stopTyping, broadcastRead } = useTypingIndicator(conversationId, currentUserId);
  const markRead = useMarkRead();
  const sendMessage = useSendMessage(conversationId);
  const sendMediaMessage = useSendMediaMessage(conversationId);
  const deleteMsg = useDeleteMessage(conversationId);
  const toggleReaction = useToggleReaction(conversationId);
  const forwardMessage = useForwardMessage();
  const { data: otherLastRead } = useOtherLastRead(conversationId);

  // Setup realtime
  useChatRealtime(conversationId, currentUserId);

  // Mark read on mount and when tab becomes visible
  useEffect(() => {
    if (!conversationId) return;
    markRead.mutate(conversationId);
    broadcastRead();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        markRead.mutate(conversationId);
        broadcastRead();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load more messages (IntersectionObserver on sentinel)
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten messages from infinite query pages
  const messages = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  // Group messages by date for separators
  const messagesWithDates = useMemo(() => {
    const result: Array<{ type: "message"; message: ChatMessage } | { type: "date"; date: string }> = [];
    let lastDate = "";

    // Messages come newest first, we iterate in reverse to build chronological order
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const msgDate = new Date(msg.created_at).toLocaleDateString("en-CA");
      if (msgDate !== lastDate) {
        result.push({ type: "date", date: msg.created_at });
        lastDate = msgDate;
      }
      result.push({ type: "message", message: msg });
    }

    return result;
  }, [messages]);

  const handleSend = useCallback((content: string, replyToMessageId?: string) => {
    sendMessage.mutate({ content, replyToMessageId }, {
      onError: () => toast.error(t("chat.messageSendError")),
    });
  }, [sendMessage, t]);

  const handleSendMedia = useCallback((params: { messageType: "image" | "video" | "voice"; file: File; localPreviewUrl: string; durationMs?: number }) => {
    sendMediaMessage.mutate(params, {
      onError: () => toast.error(t("chat.mediaUploadError")),
    });
  }, [sendMediaMessage, t]);

  const handleDelete = useCallback((messageId: string) => {
    if (confirm(t("chat.deleteConfirmMessage"))) {
      deleteMsg.mutate(messageId);
    }
  }, [deleteMsg, t]);

  const handleReact = useCallback((messageId: string, emoji: string) => {
    toggleReaction.mutate({ messageId, emoji });
  }, [toggleReaction]);

  const handleForward = useCallback((friendId: string) => {
    if (!forwardingMessage) return;
    forwardMessage.mutate(
      { message: forwardingMessage, friendId },
      {
        onSuccess: () => {
          toast.success(t("chat.messageForwarded"));
          setForwardingMessage(null);
        },
      }
    );
  }, [forwardMessage, forwardingMessage, t]);

  const handleScroll = useCallback(() => {
    const el = messageListRef.current;
    if (!el) return;
    // flex-col-reverse: scrollTop is 0 at bottom, negative when scrolled up
    setShowScrollDown(el.scrollTop < -200);
  }, []);

  const scrollToBottom = useCallback(() => {
    messageListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-cyan-400/50");
      setTimeout(() => el.classList.remove("ring-2", "ring-cyan-400/50"), 2000);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700 shrink-0">
        {onBack && (
          <button onClick={onBack} className="p-1 hover:bg-slate-800 rounded-md">
            <ArrowLeft size={20} />
          </button>
        )}
        <Image
          src={otherUser.profile_picture || "/default-avatar.png"}
          alt={otherUser.display_name}
          width={36}
          height={36}
          className="rounded-full w-9 h-9 object-cover"
        />
        <span className="text-sm">{otherUser.display_name}</span>
      </div>

      {/* Message list */}
      <div className="relative flex-1">
      <div
        ref={messageListRef}
        onScroll={handleScroll}
        className="absolute inset-0 flex flex-col-reverse overflow-y-auto"
      >
        {/* Typing indicator */}
        {isOtherTyping && <TypingIndicator />}

        {/* Messages (newest first due to flex-col-reverse) */}
        <div className="flex flex-col gap-1 py-2">
          {messagesWithDates.map((item, i) => {
            if (item.type === "date") {
              return <DateSeparator key={`date-${i}`} date={item.date} />;
            }
            const msg = item.message;
            const isOwn = msg.sender_id === currentUserId;
            const showRead = isOwn && !!otherLastRead && msg.created_at <= otherLastRead;
            return (
              <ChatBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                showReadReceipt={showRead}
                onReply={() => setReplyingTo(msg)}
                onDelete={() => handleDelete(msg.id)}
                onReact={(emoji) => handleReact(msg.id, emoji)}
                onForward={() => setForwardingMessage(msg)}
                onScrollToMessage={scrollToMessage}
              />
            );
          })}
        </div>

        {/* Load more sentinel */}
        <div ref={sentinelRef} className="h-1">
          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 border border-slate-600 shadow-lg transition-colors"
        >
          <ChevronDown size={20} className="text-gray-200" />
        </button>
      )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onSendMedia={handleSendMedia}
        isSendingMedia={sendMediaMessage.isPending}
        isActive={isActive}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        sendTyping={sendTyping}
        stopTyping={stopTyping}
      />

      {/* Forward modal */}
      <FriendPickerModal
        isOpen={!!forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        onSelect={handleForward}
        title={t("chat.forwardTo")}
      />
    </div>
  );
}
