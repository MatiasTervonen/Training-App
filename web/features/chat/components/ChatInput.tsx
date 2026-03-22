"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Send, X, Plus, ImageIcon, Video, Mic, Square } from "lucide-react";
import toast from "react-hot-toast";
import { ChatMessage, LinkPreview } from "@/types/chat";
import ReplyPreview from "@/features/chat/components/ReplyPreview";
import LinkPreviewCard from "@/features/chat/components/LinkPreviewCard";
import ChatMediaPreview from "@/features/chat/components/ChatMediaPreview";
import { fetchLinkPreview } from "@/database/chat/fetch-link-preview";
import { useVoiceRecording } from "@/features/chat/hooks/useVoiceRecording";
import { getVideoDurationMs, formatDurationMs } from "@/lib/chat/upload-chat-media";

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/;

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm";
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50 MB raw
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_VIDEO_DURATION_MS = 5 * 60 * 1000; // 5 min
const MAX_VOICE_DURATION_MS = 30 * 60 * 1000; // 30 min

type PendingMedia = {
  type: "image" | "video" | "voice";
  file: File;
  previewUrl: string;
  durationMs?: number;
};

type ChatInputProps = {
  onSend: (content: string, replyToMessageId?: string) => void;
  onSendMedia: (params: { messageType: "image" | "video" | "voice"; file: File; localPreviewUrl: string; durationMs?: number }) => void;
  isSendingMedia: boolean;
  isActive: boolean;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  sendTyping: () => void;
  stopTyping: () => void;
};

export default function ChatInput({
  onSend,
  onSendMedia,
  isSendingMedia,
  isActive,
  replyingTo,
  onCancelReply,
  sendTyping,
  stopTyping,
}: ChatInputProps) {
  const { t } = useTranslation("chat");
  const [text, setText] = useState("");
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const [showMediaToolbar, setShowMediaToolbar] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const voice = useVoiceRecording();

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

  // When voice recording finishes, set as pending media
  useEffect(() => {
    if (!voice.isRecording && voice.audioFile && voice.audioUrl) {
      setPendingMedia({
        type: "voice",
        file: voice.audioFile,
        previewUrl: voice.audioUrl,
        durationMs: voice.durationMs,
      });
      setShowMediaToolbar(false);
    }
  }, [voice.isRecording, voice.audioFile, voice.audioUrl, voice.durationMs]);

  // URL detection with debounce
  useEffect(() => {
    if (previewDismissed || pendingMedia) return;
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
  }, [text, previewDismissed, pendingMedia]);

  const handleSend = useCallback(() => {
    if (pendingMedia) {
      onSendMedia({
        messageType: pendingMedia.type,
        file: pendingMedia.file,
        localPreviewUrl: pendingMedia.previewUrl,
        durationMs: pendingMedia.durationMs,
      });
      setPendingMedia(null);
      setShowMediaToolbar(false);
      return;
    }

    const trimmed = text.trim();
    if (!trimmed || !isActive) return;
    onSend(trimmed, replyingTo?.id);
    setText("");
    setLinkPreview(null);
    setPreviewDismissed(false);
    stopTyping();
    onCancelReply();
  }, [text, isActive, onSend, onSendMedia, replyingTo, stopTyping, onCancelReply, pendingMedia]);

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

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t("chat.fileTooLarge"));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingMedia({ type: "image", file, previewUrl });
    setShowMediaToolbar(false);
  }, [t]);

  const handleVideoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > MAX_VIDEO_SIZE) {
      toast.error(t("chat.fileTooLarge"));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    let durationMs: number | undefined;
    try {
      durationMs = await getVideoDurationMs(file);
    } catch {
      // Duration is optional
    }

    if (durationMs && durationMs > MAX_VIDEO_DURATION_MS) {
      URL.revokeObjectURL(previewUrl);
      toast.error(t("chat.videoTooLong"));
      return;
    }

    setPendingMedia({ type: "video", file, previewUrl, durationMs });
    setShowMediaToolbar(false);
  }, [t]);

  const handleCancelMedia = useCallback(() => {
    if (pendingMedia?.previewUrl) {
      URL.revokeObjectURL(pendingMedia.previewUrl);
    }
    setPendingMedia(null);
    voice.cancelRecording();
  }, [pendingMedia, voice]);

  const handleVoiceToggle = useCallback(() => {
    if (voice.isRecording) {
      voice.stopRecording();
    } else {
      voice.startRecording();
    }
  }, [voice]);

  if (!isActive) {
    return (
      <div className="p-4 border-t border-slate-700">
        <p className="font-body text-sm text-gray-500 text-center">{t("chat.inactive")}</p>
      </div>
    );
  }

  const canSend = pendingMedia ? !isSendingMedia : !!text.trim();

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
      {linkPreview && !previewDismissed && !pendingMedia && (
        <div className="px-4 pt-3">
          <LinkPreviewCard
            preview={linkPreview}
            onDismiss={() => { setLinkPreview(null); setPreviewDismissed(true); }}
          />
        </div>
      )}

      {/* Media preview */}
      {pendingMedia && (
        <ChatMediaPreview
          type={pendingMedia.type}
          previewUrl={pendingMedia.previewUrl}
          durationMs={pendingMedia.durationMs}
          onCancel={handleCancelMedia}
        />
      )}

      {/* Voice recording indicator */}
      {voice.isRecording && (
        <div className="flex items-center gap-3 px-4 pt-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-body text-sm text-red-400">
            {t("chat.recording")} {formatDurationMs(voice.durationMs)}
          </span>
          <button
            onClick={() => voice.cancelRecording()}
            className="font-body text-xs text-gray-400 hover:text-gray-300 ml-auto"
          >
            {t("chat.cancel")}
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        {/* Attach button */}
        <button
          onClick={() => setShowMediaToolbar(!showMediaToolbar)}
          disabled={voice.isRecording || isSendingMedia}
          className="p-2.5 rounded-full hover:bg-slate-800 text-gray-400 hover:text-gray-300 transition-colors shrink-0 disabled:opacity-40"
        >
          <Plus size={18} className={showMediaToolbar ? "rotate-45 transition-transform" : "transition-transform"} />
        </button>

        {voice.isRecording ? (
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={handleVoiceToggle}
              className="p-2.5 rounded-full bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <Square size={18} fill="currentColor" />
            </button>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={pendingMedia ? t("chat.sendMedia") : t("chat.typeMessage")}
            rows={1}
            maxLength={2000}
            disabled={!!pendingMedia}
            className="font-body flex-1 resize-none bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-500 disabled:opacity-50"
          />
        )}

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="p-2.5 rounded-full bg-slate-800 border border-cyan-500 text-cyan-400 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Media toolbar */}
      {showMediaToolbar && !voice.isRecording && !pendingMedia && (
        <div className="flex items-center gap-1 px-3 pb-3">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ImageIcon size={18} className="text-cyan-400" />
            <span className="font-body text-sm text-gray-400">{t("chat.photo")}</span>
          </button>
          <button
            onClick={() => videoInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Video size={18} className="text-cyan-400" />
            <span className="font-body text-sm text-gray-400">{t("chat.video")}</span>
          </button>
          <button
            onClick={handleVoiceToggle}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Mic size={18} className="text-cyan-400" />
            <span className="font-body text-sm text-gray-400">{t("chat.voiceMessage")}</span>
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept={VIDEO_ACCEPT}
        onChange={handleVideoSelect}
        className="hidden"
      />
    </div>
  );
}
