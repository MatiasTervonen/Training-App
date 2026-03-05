import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type SessionImage = {
  id: string;
  storage_path: string;
  uri: string;
};

export type SessionVideo = {
  id: string;
  storage_path: string;
  uri: string;
  thumbnailUri: string;
  duration_ms: number | null;
};

export type ActivitySessionMedia = {
  images: SessionImage[];
  videos: SessionVideo[];
};

export async function getActivitySessionMedia(
  sessionId: string,
): Promise<ActivitySessionMedia> {
  // Fetch images
  const { data: imageData, error: imageError } = await supabase
    .from("session_images")
    .select("id, storage_path")
    .eq("session_id", sessionId);

  if (imageError) {
    handleError(imageError, {
      message: "Error fetching session images",
      route: "/database/activities/get-activity-session-media",
      method: "GET",
    });
    throw new Error("Error fetching session images");
  }

  // Fetch videos
  const { data: videoData, error: videoError } = await supabase
    .from("session_videos")
    .select("id, storage_path, thumbnail_storage_path, duration_ms")
    .eq("session_id", sessionId);

  if (videoError) {
    handleError(videoError, {
      message: "Error fetching session videos",
      route: "/database/activities/get-activity-session-media",
      method: "GET",
    });
    throw new Error("Error fetching session videos");
  }

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

  // Get signed URLs for videos and thumbnails
  const videos = await Promise.all(
    (videoData ?? []).map(async (video) => {
      const { data: videoUrlData } = await supabase.storage
        .from("media-videos")
        .createSignedUrl(video.storage_path, 3600);

      const thumbnailUri = video.thumbnail_storage_path
        ? (
            await supabase.storage
              .from("media-videos")
              .createSignedUrl(video.thumbnail_storage_path, 3600)
          ).data?.signedUrl ?? ""
        : "";

      return {
        id: video.id,
        storage_path: video.storage_path,
        uri: videoUrlData?.signedUrl ?? "",
        thumbnailUri,
        duration_ms: video.duration_ms,
      };
    }),
  );

  return {
    images: images.filter((img) => img.uri !== ""),
    videos: videos.filter((v) => v.uri !== ""),
  };
}
