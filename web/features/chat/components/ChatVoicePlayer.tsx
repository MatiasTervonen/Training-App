"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { getChatMediaSignedUrl } from "@/lib/chat/upload-chat-media";

type ChatVoicePlayerProps = {
  storagePath: string | null;
  localPreviewUrl?: string;
  durationMs: number | null;
  isOwn: boolean;
  isUploading?: boolean;
};

export default function ChatVoicePlayer({
  storagePath,
  localPreviewUrl,
  durationMs,
  isOwn,
  isUploading,
}: ChatVoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(localPreviewUrl ?? null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState((durationMs ?? 0) / 1000);
  const [loading, setLoading] = useState(!localPreviewUrl && !!storagePath);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localPreviewUrl) {
      setAudioUrl(localPreviewUrl);
      setLoading(false);
      return;
    }
    if (!storagePath) return;

    let cancelled = false;
    setLoading(true);
    getChatMediaSignedUrl(storagePath)
      .then((url) => {
        if (!cancelled) {
          setAudioUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [storagePath, localPreviewUrl]);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      if (audio.ended) audio.currentTime = 0;
      audio.play();
      setPlaying(true);
    }
  }, [playing]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;

    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const trackBg = isOwn ? "bg-cyan-950" : "bg-slate-600";
  const fillBg = isOwn ? "bg-cyan-400" : "bg-slate-300";
  const textColor = isOwn ? "text-cyan-200/70" : "text-slate-400";

  if (isUploading || loading) {
    return (
      <div className="flex items-center gap-3 w-[200px] py-1">
        <Loader2 size={18} className="animate-spin text-slate-400 shrink-0" />
        <div className={`flex-1 h-1 rounded-full ${trackBg}`} />
        <span className={`font-body text-xs ${textColor} shrink-0`}>
          {formatTime(duration)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-[200px] py-1">
      <button onClick={togglePlay} className="shrink-0" disabled={!audioUrl}>
        {playing ? (
          <Pause size={18} className={isOwn ? "text-cyan-300" : "text-slate-300"} />
        ) : (
          <Play size={18} className={isOwn ? "text-cyan-300" : "text-slate-300"} fill="currentColor" />
        )}
      </button>

      <div
        ref={progressRef}
        onClick={handleSeek}
        className={`flex-1 h-1 rounded-full cursor-pointer ${trackBg} relative`}
      >
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-100 ${fillBg}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className={`font-body text-xs ${textColor} shrink-0`}>
        {playing ? formatTime(currentTime) : formatTime(duration)}
      </span>
    </div>
  );
}
