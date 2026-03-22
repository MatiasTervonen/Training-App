"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Send, X } from "lucide-react";
import { ChatMessage, LinkPreview } from "@/types/chat";
import ReplyPreview from "@/features/chat/components/ReplyPreview";
import LinkPreviewCard from "@/features/chat/components/LinkPreviewCard";
import { fetchLinkPreview } from "@/database/chat/fetch-link-preview";

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/;

type ChatInputProps = {
  onSend: (content: string, replyToMessageId?: string) => void;
  isActive: boolean;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  sendTyping: () => void;
  stopTyping: () => void;
};

export default function ChatInput({ onSend, isActive, replyingTo, onCancelReply, sendTyping, stopTyping }: ChatInputProps) {
  const { t } = useTranslation("chat");
  const [text, setText] = useState("");
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  // URL detection with debounce
  useEffect(() => {
    if (previewDismissed) return;
    clearTimeout(debounceRef.current);

    const match = text.match(URL_REGEX);
    if (!match) {
      setLinkPreview(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const preview = await fetchLinkPreview(match[0]);
        setLinkPreview(preview as LinkPreview);
      } catch {
        setLinkPreview(null);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [text, previewDismissed]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !isActive) return;
    onSend(trimmed, replyingTo?.id);
    setText("");
    setLinkPreview(null);
    setPreviewDismissed(false);
    stopTyping();
    onCancelReply();
  }, [text, isActive, onSend, replyingTo, stopTyping, onCancelReply]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setPreviewDismissed(false);
    sendTyping();
  }, [sendTyping]);

  if (!isActive) {
    return (
      <div className="p-4 border-t border-slate-700">
        <p className="font-body text-sm text-gray-500 text-center">{t("chat.inactive")}</p>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-700 bg-slate-900">
      {/* Reply bar */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 pt-3">
          <div className="flex-1 min-w-0">
            <ReplyPreview
              senderName={replyingTo.sender_display_name}
              content={replyingTo.content}
              messageType={replyingTo.message_type}
              isDeleted={!!replyingTo.deleted_at}
            />
          </div>
          <button onClick={onCancelReply} className="p-1 hover:bg-slate-700 rounded-full shrink-0">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
      )}

      {/* Link preview */}
      {linkPreview && !previewDismissed && (
        <div className="px-4 pt-3">
          <LinkPreviewCard
            preview={linkPreview}
            onDismiss={() => { setLinkPreview(null); setPreviewDismissed(true); }}
          />
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.typeMessage")}
          rows={1}
          maxLength={2000}
          className="font-body flex-1 resize-none bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-500"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2.5 rounded-full bg-slate-800 border border-cyan-500 text-cyan-400 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
