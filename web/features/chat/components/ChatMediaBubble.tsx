"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Loader2 } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { getChatMediaSignedUrl, clearSignedUrlCache, formatDurationMs } from "@/lib/chat/upload-chat-media";
import ChatVoicePlayer from "@/features/chat/components/ChatVoicePlayer";

type ChatMediaBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
};

export default function ChatMediaBubble({ message, isOwn }: ChatMediaBubbleProps) {
  const { message_type, media_storage_path, media_duration_ms, _isUploading, _localPreviewUrl } = message;

  const [mediaUrl, setMediaUrl] = useState<string | null>(_localPreviewUrl ?? null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!_localPreviewUrl);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (_localPreviewUrl) {
      setMediaUrl(_localPreviewUrl);
      setLoading(false);
      return;
    }
    if (!media_storage_path) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    getChatMediaSignedUrl(media_storage_path)
      .then((url) => {
        if (!cancelled) {
          setMediaUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    // Load thumbnail for videos
    if (message_type === "video" && message.media_thumbnail_path) {
      getChatMediaSignedUrl(message.media_thumbnail_path)
        .then((url) => {
          if (!cancelled) setThumbnailUrl(url);
        })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [media_storage_path, message_type, message.media_thumbnail_path, _localPreviewUrl]);

  const handleRetry = useCallback(() => {
    if (media_storage_path) {
      clearSignedUrlCache(media_storage_path);
      setError(false);
      setLoading(true);
      getChatMediaSignedUrl(media_storage_path)
        .then(setMediaUrl)
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [media_storage_path]);

  if (message_type === "voice") {
    return (
      <ChatVoicePlayer
        storagePath={media_storage_path}
        localPreviewUrl={_localPreviewUrl}
        durationMs={media_duration_ms}
        isOwn={isOwn}
        isUploading={_isUploading}
      />
    );
  }

  if (loading) {
    return (
      <div className="w-[240px] h-[160px] rounded-lg bg-slate-700/50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !mediaUrl) {
    return (
      <button
        onClick={handleRetry}
        className="w-[240px] h-[160px] rounded-lg bg-slate-700/50 flex items-center justify-center"
      >
        <span className="font-body text-xs text-slate-400">Tap to retry</span>
      </button>
    );
  }

  if (message_type === "image") {
    return (
      <>
        <button onClick={() => setFullscreen(true)} className="block">
          <img
            src={mediaUrl}
            alt=""
            className="max-w-[240px] max-h-[320px] rounded-lg object-cover"
            loading="lazy"
          />
          {_isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
              <Loader2 size={24} className="animate-spin text-white" />
            </div>
          )}
        </button>

        {fullscreen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
            onClick={() => setFullscreen(false)}
          >
            <img
              src={mediaUrl}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
          </div>
        )}
      </>
    );
  }

  if (message_type === "video") {
    const displayUrl = thumbnailUrl ?? mediaUrl;

    return (
      <>
        <button onClick={() => setFullscreen(true)} className="relative block">
          {thumbnailUrl ? (
            <img
              src={displayUrl}
              alt=""
              className="w-[240px] h-[160px] rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-[240px] h-[160px] rounded-lg bg-slate-700/50" />
          )}

          <div className="absolute inset-0 flex items-center justify-center">
            {_isUploading ? (
              <Loader2 size={32} className="animate-spin text-white" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                <Play size={24} className="text-white ml-1" fill="white" />
              </div>
            )}
          </div>

          {media_duration_ms && (
            <div className="absolute bottom-2 right-2 bg-black/70 rounded px-1.5 py-0.5">
              <span className="font-body text-xs text-white">{formatDurationMs(media_duration_ms)}</span>
            </div>
          )}
        </button>

        {fullscreen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setFullscreen(false); }}
          >
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-w-[90vw] max-h-[90vh]"
            />
          </div>
        )}
      </>
    );
  }

  return null;
}
