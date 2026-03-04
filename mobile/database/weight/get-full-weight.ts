import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type WeightImage = {
  id: string;
  storage_path: string;
  uri: string;
};

export type WeightVideo = {
  id: string;
  storage_path: string;
  thumbnailUri: string;
  uri: string;
  duration_ms: number | null;
};

export type FullWeightSession = {
  id: string;
  voiceRecordings: {
    id: string;
    storage_path: string;
    duration_ms: number | null;
    uri: string;
  }[];
  images: WeightImage[];
  videos: WeightVideo[];
};

export async function getFullWeightSession(
  weightId: string,
): Promise<FullWeightSession> {
  // Fetch all media types in parallel
  const [voiceResult, imageResult, videoResult] = await Promise.all([
    supabase
      .from("weight_voice" as "notes_voice")
      .select("id, storage_path, duration_ms")
      .eq("weight_id", weightId) as unknown as Promise<{
        data: { id: string; storage_path: string; duration_ms: number | null }[] | null;
        error: { message: string } | null;
      }>,
    supabase
      .from("weight_images" as "notes_voice")
      .select("id, storage_path")
      .eq("weight_id", weightId) as unknown as Promise<{
        data: { id: string; storage_path: string }[] | null;
        error: { message: string } | null;
      }>,
    supabase
      .from("weight_videos" as "notes_voice")
      .select("id, storage_path, thumbnail_storage_path, duration_ms")
      .eq("weight_id", weightId) as unknown as Promise<{
        data: { id: string; storage_path: string; thumbnail_storage_path: string | null; duration_ms: number | null }[] | null;
        error: { message: string } | null;
      }>,
  ]);

  if (voiceResult.error) {
    handleError(voiceResult.error, {
      message: "Error fetching weight voice recordings",
      route: "/database/weight/get-full-weight",
      method: "GET",
    });
    throw new Error("Error fetching weight voice recordings");
  }

  if (imageResult.error) {
    handleError(imageResult.error, {
      message: "Error fetching weight images",
      route: "/database/weight/get-full-weight",
      method: "GET",
    });
    throw new Error("Error fetching weight images");
  }

  if (videoResult.error) {
    handleError(videoResult.error, {
      message: "Error fetching weight videos",
      route: "/database/weight/get-full-weight",
      method: "GET",
    });
    throw new Error("Error fetching weight videos");
  }

  const voiceData = voiceResult.data;
  const imageData = imageResult.data;
  const videoData = videoResult.data;

  // Get signed URLs for voice recordings
  const voiceRecordings = await Promise.all(
    (voiceData ?? []).map(async (voice) => {
      const { data: urlData } = await supabase.storage
        .from("notes-voice")
        .createSignedUrl(voice.storage_path, 3600);

      return {
        id: voice.id,
        storage_path: voice.storage_path,
        duration_ms: voice.duration_ms,
        uri: urlData?.signedUrl ?? "",
      };
    }),
  );

  // Get signed URLs for images
  const images = await Promise.all(
    (imageData ?? []).map(async (image) => {
      const { data: urlData } = await supabase.storage
        .from("notes-images")
        .createSignedUrl(image.storage_path, 3600);

      return {
        id: image.id,
        storage_path: image.storage_path,
        uri: urlData?.signedUrl ?? "",
      };
    }),
  );

  // Get signed URLs for videos and thumbnails (parallel)
  const videos = await Promise.all(
    (videoData ?? []).map(async (video) => {
      const [videoUrlResult, thumbnailUrlResult] = await Promise.all([
        supabase.storage.from("media-videos").createSignedUrl(video.storage_path, 3600),
        video.thumbnail_storage_path
          ? supabase.storage.from("media-videos").createSignedUrl(video.thumbnail_storage_path, 3600)
          : Promise.resolve({ data: null }),
      ]);

      return {
        id: video.id,
        storage_path: video.storage_path,
        uri: videoUrlResult.data?.signedUrl ?? "",
        thumbnailUri: thumbnailUrlResult.data?.signedUrl ?? "",
        duration_ms: video.duration_ms,
      };
    }),
  );

  const validRecordings = voiceRecordings.filter((v) => v.uri !== "");
  const validImages = images.filter((img) => img.uri !== "");
  const validVideos = videos.filter((v) => v.uri !== "");

  return {
    id: weightId,
    voiceRecordings: validRecordings,
    images: validImages,
    videos: validVideos,
  };
}
