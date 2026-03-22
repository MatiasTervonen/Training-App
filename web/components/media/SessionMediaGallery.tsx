"use client";

import MediaImage from "@/components/media/MediaImage";
import MediaVideo from "@/components/media/MediaVideo";
import VoicePlayer from "@/components/media/VoicePlayer";
import type { SessionMedia } from "@/types/media";

type SessionMediaGalleryProps = SessionMedia;

export default function SessionMediaGallery({
  images,
  videos,
  voiceRecordings,
}: SessionMediaGalleryProps) {
  const hasMedia =
    images.length > 0 || videos.length > 0 || voiceRecordings.length > 0;

  if (!hasMedia) return null;

  const mediaCount = images.length + videos.length;

  return (
    <div className="flex flex-col gap-3 mt-5 w-full">
      {voiceRecordings.map((rec) => (
        <VoicePlayer key={rec.id} recording={rec} />
      ))}

      {mediaCount > 0 && (
        <div className="grid gap-3 grid-cols-2">
          {images.map((img) => (
            <MediaImage key={img.id} image={img} />
          ))}
          {videos.map((vid) => (
            <MediaVideo key={vid.id} video={vid} />
          ))}
        </div>
      )}
    </div>
  );
}
