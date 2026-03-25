"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { SessionVideo } from "@/types/media";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type MediaVideoProps = {
  video: SessionVideo;
};

export default function MediaVideo({ video }: MediaVideoProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <button
        onClick={() => setFullscreen(true)}
        className="relative rounded-md overflow-hidden border-[1.5px] border-blue-500/60 bg-slate-950"
      >
        {video.thumbnailUri ? (
          <Image
            src={video.thumbnailUri}
            alt=""
            width={400}
            height={192}
            className="w-full h-48 object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-48 bg-slate-800" />
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
            <Play size={24} className="text-white ml-1" fill="white" />
          </div>
        </div>

        {video.duration_ms != null && (
          <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-0.5">
            <span className="font-body text-xs text-white">
              {formatDuration(video.duration_ms)}
            </span>
          </div>
        )}
      </button>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFullscreen(false);
          }}
        >
          <video
            src={video.uri}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[90vh]"
          />
        </div>
      )}
    </>
  );
}
