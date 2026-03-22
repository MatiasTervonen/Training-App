"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import type { SessionVoiceRecording } from "@/types/media";

type VoicePlayerProps = {
  recording: SessionVoiceRecording;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VoicePlayer({ recording }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(
    (recording.duration_ms ?? 0) / 1000,
  );
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = new Audio(recording.uri);
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
  }, [recording.uri]);

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

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !duration) return;

      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      audio.currentTime = ratio * duration;
      setCurrentTime(audio.currentTime);
    },
    [duration],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-slate-950 rounded-xl border-[1.5px] border-blue-500/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <button onClick={togglePlay} className="shrink-0">
          {playing ? (
            <Pause size={18} className="text-blue-400" fill="currentColor" />
          ) : (
            <Play size={18} className="text-blue-400" fill="currentColor" />
          )}
        </button>

        <div
          ref={progressRef}
          onClick={handleSeek}
          className="flex-1 h-1.5 rounded-full cursor-pointer bg-slate-600 relative"
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-blue-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="font-body text-xs text-slate-400 shrink-0">
          {playing ? formatTime(currentTime) : formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
