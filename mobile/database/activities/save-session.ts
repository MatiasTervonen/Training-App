import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { DraftRecording, DraftVideo } from "@/types/session";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system/next";

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
};

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
}: props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const uploadedRecordings: {
    storage_path: string;
    duration_ms?: number;
  }[] = [];

  const uploadedImages: { storage_path: string }[] = [];
  const uploadedVideos: { storage_path: string; thumbnail_storage_path: string; duration_ms: number }[] = [];

  try {
    // Upload all media in parallel for speed
    const [recordingResults, imageResults, videoResults] = await Promise.all([
      // Voice recordings
      Promise.all(
        draftRecordings.map(async (recording) => {
          const path = `${session.user.id}/${Crypto.randomUUID()}.m4a`;
          const file = new File(recording.uri);
          const bytes = await file.bytes();
          const { error: uploadError } = await supabase.storage
            .from("notes-voice")
            .upload(path, bytes, { contentType: "audio/m4a" });
          if (uploadError) throw uploadError;
          return { storage_path: path, duration_ms: recording.durationMs };
        }),
      ),
      // Images
      Promise.all(
        draftImages.map(async (image) => {
          const ext = image.uri.split(".").pop()?.toLowerCase() ?? "jpg";
          const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
          const path = `${session.user.id}/${Crypto.randomUUID()}.${ext}`;
          const file = new File(image.uri);
          const bytes = await file.bytes();
          const { error: uploadError } = await supabase.storage
            .from("notes-images")
            .upload(path, bytes, { contentType: mimeType });
          if (uploadError) throw uploadError;
          return { storage_path: path };
        }),
      ),
      // Videos (video + thumbnail uploaded in parallel per video)
      Promise.all(
        draftVideos.map(async (video) => {
          const videoPath = `${session.user.id}/${Crypto.randomUUID()}.mp4`;
          const thumbPath = `${session.user.id}/${Crypto.randomUUID()}-thumb.jpg`;
          const [videoBytes, thumbBytes] = await Promise.all([
            new File(video.uri).bytes(),
            new File(video.thumbnailUri).bytes(),
          ]);
          const [videoUpload, thumbUpload] = await Promise.all([
            supabase.storage.from("media-videos").upload(videoPath, videoBytes, { contentType: "video/mp4" }),
            supabase.storage.from("media-videos").upload(thumbPath, thumbBytes, { contentType: "image/jpeg" }),
          ]);
          if (videoUpload.error) throw videoUpload.error;
          if (thumbUpload.error) throw thumbUpload.error;
          return { storage_path: videoPath, thumbnail_storage_path: thumbPath, duration_ms: video.durationMs };
        }),
      ),
    ]);

    uploadedRecordings.push(...recordingResults);
    uploadedImages.push(...imageResults);
    uploadedVideos.push(...videoResults);

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
