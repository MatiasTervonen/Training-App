import { createClient } from "@/utils/supabase/client";
import type {
  SessionImage,
  SessionVideo,
  SessionVoiceRecording,
  SessionMedia,
} from "@/types/media";

type RawImage = { id: string; storage_path: string };
type RawVideo = {
  id: string;
  storage_path: string;
  thumbnail_storage_path: string | null;
  duration_ms: number | null;
};
type RawVoice = {
  id: string;
  storage_path: string;
  duration_ms: number | null;
};

async function signImages(
  images: RawImage[],
): Promise<SessionImage[]> {
  if (images.length === 0) return [];
  const supabase = createClient();

  const signed = await Promise.all(
    images.map(async (img) => {
      const { data } = await supabase.storage
        .from("notes-images")
        .createSignedUrl(img.storage_path, 3600);
      return { ...img, uri: data?.signedUrl ?? "" };
    }),
  );
  return signed.filter((img) => img.uri !== "");
}

async function signVideos(
  videos: RawVideo[],
): Promise<SessionVideo[]> {
  if (videos.length === 0) return [];
  const supabase = createClient();

  const signed = await Promise.all(
    videos.map(async (vid) => {
      const { data: videoData } = await supabase.storage
        .from("media-videos")
        .createSignedUrl(vid.storage_path, 3600);
      const thumbnailUri = vid.thumbnail_storage_path
        ? (
            await supabase.storage
              .from("media-videos")
              .createSignedUrl(vid.thumbnail_storage_path, 3600)
          ).data?.signedUrl ?? ""
        : "";
      return {
        ...vid,
        uri: videoData?.signedUrl ?? "",
        thumbnailUri,
      };
    }),
  );
  return signed.filter((v) => v.uri !== "");
}

async function signVoiceRecordings(
  recordings: RawVoice[],
): Promise<SessionVoiceRecording[]> {
  if (recordings.length === 0) return [];
  const supabase = createClient();

  const signed = await Promise.all(
    recordings.map(async (rec) => {
      const { data } = await supabase.storage
        .from("notes-voice")
        .createSignedUrl(rec.storage_path, 3600);
      return { ...rec, uri: data?.signedUrl ?? "" };
    }),
  );
  return signed.filter((r) => r.uri !== "");
}

export async function fetchAndSignMedia(
  imageRows: RawImage[],
  videoRows: RawVideo[],
  voiceRows: RawVoice[],
): Promise<SessionMedia> {
  const [images, videos, voiceRecordings] = await Promise.all([
    signImages(imageRows),
    signVideos(videoRows),
    signVoiceRecordings(voiceRows),
  ]);
  return { images, videos, voiceRecordings };
}
