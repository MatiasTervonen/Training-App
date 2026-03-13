import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { uploadFileToStorage, getAccessToken } from "@/lib/upload-with-progress";
import { DraftRecording, DraftVideo } from "@/types/session";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";

type DraftImage = {
  id: string;
  uri: string;
};

type props = {
  title: string;
  notes: string;
  duration: number;
  start_time: string;
  end_time: string;
  track: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
    timestamp: number;
    is_stationary: number;
  }[];
  activityId: string;
  steps: number;
  draftRecordings: DraftRecording[];
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
  templateId?: string | null;
  onProgress?: (progress: number | undefined) => void;
  stepDistanceMeters?: number | null;
};

async function getFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && "size" in info ? (info.size ?? 0) : 0;
}

export async function saveActivitySession({
  title,
  notes,
  duration,
  start_time,
  end_time,
  track,
  activityId,
  steps,
  draftRecordings,
  draftImages = [],
  draftVideos = [],
  templateId = null,
  onProgress,
  stepDistanceMeters = null,
}: props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const accessToken = await getAccessToken();

  const uploadedRecordings: {
    storage_path: string;
    duration_ms?: number;
  }[] = [];

  const uploadedImages: { storage_path: string }[] = [];
  const uploadedVideos: { storage_path: string; thumbnail_storage_path: string; duration_ms: number }[] = [];

  try {
    // Calculate total bytes for progress tracking
    const allUris = [
      ...draftRecordings.map((r) => r.uri),
      ...draftImages.map((i) => i.uri),
      ...draftVideos.flatMap((v) => [v.uri, v.thumbnailUri]),
    ];
    const sizes = await Promise.all(allUris.map(getFileSize));
    const totalBytes = sizes.reduce((a, b) => a + b, 0);
    if (totalBytes > 0) onProgress?.(0);

    // Track per-file progress for parallel uploads
    const fileProgress = new Map<string, number>();
    const updateProgress = () => {
      const loaded = Array.from(fileProgress.values()).reduce((a, b) => a + b, 0);
      onProgress?.(totalBytes > 0 ? loaded / totalBytes : 0);
    };
    const makeHandler = (key: string, fileSize: number) => (loaded: number) => {
      fileProgress.set(key, Math.min(loaded, fileSize));
      updateProgress();
    };

    // Upload all media in parallel for speed
    const recOffset = 0;
    const imgOffset = draftRecordings.length;
    const vidOffset = draftRecordings.length + draftImages.length;

    const [recordingResults, imageResults, videoResults] = await Promise.all([
      // Voice recordings
      Promise.all(
        draftRecordings.map(async (recording, i) => {
          const path = `${session.user.id}/${Crypto.randomUUID()}.m4a`;
          const key = `rec-${i}`;
          const fileSize = sizes[recOffset + i];
          fileProgress.set(key, 0);
          await uploadFileToStorage("notes-voice", path, recording.uri, "audio/m4a", accessToken, makeHandler(key, fileSize));
          return { storage_path: path, duration_ms: recording.durationMs };
        }),
      ),
      // Images
      Promise.all(
        draftImages.map(async (image, i) => {
          const ext = image.uri.split(".").pop()?.toLowerCase() ?? "jpg";
          const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
          const path = `${session.user.id}/${Crypto.randomUUID()}.${ext}`;
          const key = `img-${i}`;
          const fileSize = sizes[imgOffset + i];
          fileProgress.set(key, 0);
          await uploadFileToStorage("notes-images", path, image.uri, mimeType, accessToken, makeHandler(key, fileSize));
          return { storage_path: path };
        }),
      ),
      // Videos (video + thumbnail uploaded in parallel per video)
      Promise.all(
        draftVideos.map(async (video, i) => {
          const videoPath = `${session.user.id}/${Crypto.randomUUID()}.mp4`;
          const thumbPath = `${session.user.id}/${Crypto.randomUUID()}-thumb.jpg`;

          const videoKey = `vid-${i}`;
          const thumbKey = `thumb-${i}`;
          const videoSize = sizes[vidOffset + i * 2];
          const thumbSize = sizes[vidOffset + i * 2 + 1];
          fileProgress.set(videoKey, 0);
          fileProgress.set(thumbKey, 0);

          await Promise.all([
            uploadFileToStorage("media-videos", videoPath, video.uri, "video/mp4", accessToken, makeHandler(videoKey, videoSize)),
            uploadFileToStorage("media-videos", thumbPath, video.thumbnailUri, "image/jpeg", accessToken, makeHandler(thumbKey, thumbSize)),
          ]);
          return { storage_path: videoPath, thumbnail_storage_path: thumbPath, duration_ms: video.durationMs };
        }),
      ),
    ]);

    uploadedRecordings.push(...recordingResults);
    uploadedImages.push(...imageResults);
    uploadedVideos.push(...videoResults);

    onProgress?.(undefined);

    const normalizedTrack = track.map((point) => ({
      ...point,
      timestamp: new Date(point.timestamp).toISOString(),
    }));

    const { data: sessionId, error } = await supabase.rpc(
      "activities_save_activity",
      {
        p_title: title,
        p_notes: notes,
        p_duration: duration,
        p_start_time: start_time,
        p_end_time: end_time,
        p_track: normalizedTrack,
        p_activity_id: activityId,
        p_steps: steps,
        p_draftrecordings: uploadedRecordings,
        p_images: uploadedImages,
        p_videos: uploadedVideos,
        p_template_id: templateId ?? undefined,
        p_step_distance_meters: stepDistanceMeters ?? undefined,
      },
    );

    if (error || !sessionId) {
      console.error("error saving activity session", error);
      handleError(error, {
        message: "Error saving activity session",
        route: "/database/activities/save-session",
        method: "POST",
      });
      throw new Error("Error saving activity session");
    }

    return { success: true, sessionId: sessionId as string };
  } catch (error) {
    // cleanup orphaned uploads
    if (uploadedRecordings.length > 0) {
      await supabase.storage
        .from("notes-voice")
        .remove(uploadedRecordings.map((r) => r.storage_path));
    }
    if (uploadedImages.length > 0) {
      await supabase.storage.from("notes-images").remove(uploadedImages.map((r) => r.storage_path));
    }
    if (uploadedVideos.length > 0) {
      const paths = uploadedVideos.flatMap((v) => [v.storage_path, v.thumbnail_storage_path]);
      await supabase.storage.from("media-videos").remove(paths);
    }
    console.error("Error saving activity session", error);
    handleError(error, {
      message: "Error saving activity session",
      route: "/database/activities/save-session",
      method: "POST",
    });
    throw new Error("Error saving activity session");
  }
}
