"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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

  const [fetchResult, setFetchResult] = useState<{ path: string; url: string | null; error: boolean } | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const currentResult = fetchResult?.path === media_storage_path ? fetchResult : null;
  const mediaUrl = _localPreviewUrl ?? currentResult?.url ?? null;
  const loading = !_localPreviewUrl && !!media_storage_path && !currentResult;
  const error = currentResult?.error ?? false;

  useEffect(() => {
    if (_localPreviewUrl || !media_storage_path) return;

    let cancelled = false;

    getChatMediaSignedUrl(media_storage_path)
      .then((url) => {
        if (!cancelled) setFetchResult({ path: media_storage_path, url, error: false });
      })
      .catch(() => {
        if (!cancelled) setFetchResult({ path: media_storage_path, url: null, error: true });
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
      setFetchResult(null);
      getChatMediaSignedUrl(media_storage_path)
        .then((url) => setFetchResult({ path: media_storage_path, url, error: false }))
        .catch(() => setFetchResult({ path: media_storage_path, url: null, error: true }));
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
      <div className="w-60 h-40 rounded-lg bg-slate-700/50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !mediaUrl) {
    return (
      <button
        onClick={handleRetry}
        className="w-60 h-40 rounded-lg bg-slate-700/50 flex items-center justify-center"
      >
        <span className="font-body text-xs text-slate-400">Tap to retry</span>
      </button>
    );
  }

  if (message_type === "image") {
    return (
      <>
        <button onClick={() => setFullscreen(true)} className="block">
          <Image
            src={mediaUrl}
            alt=""
            width={240}
            height={320}
            unoptimized
            className="max-w-60 max-h-80 rounded-lg object-cover"
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
            <Image
              src={mediaUrl}
              alt=""
              width={1920}
              height={1080}
              unoptimized
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
            <Image
              src={displayUrl}
              alt=""
              width={240}
              height={160}
              unoptimized
              className="w-60 h-40 rounded-lg object-cover"
            />
          ) : (
            <div className="w-60 h-40 rounded-lg bg-slate-700/50" />
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
