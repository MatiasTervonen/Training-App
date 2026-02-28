import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { useTimerStore } from "@/lib/stores/timerStore";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system/next";
import { DraftVideo } from "@/types/session";

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

type DraftImage = {
  id: string;
  uri: string;
};

type props = {
  title: string;
  notes: string;
  duration: number;
  exercises: {
    exercise_id?: string;
    notes?: string;
    superset_id?: string;
    sets: {
      weight?: number;
      reps?: number;
      rpe?: string;
      time_min?: number;
      distance_meters?: number;
    }[];
  }[];
  draftImages?: DraftImage[];
  draftRecordings?: DraftRecording[];
  draftVideos?: DraftVideo[];
};

export async function saveSession({
  exercises,
  notes,
  duration,
  title,
  draftImages = [],
  draftRecordings = [],
  draftVideos = [],
}: props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const start_time = new Date(
    useTimerStore.getState().activeSession?.started_at ?? Date.now(),
  ).toISOString();
  const end_time = new Date().toISOString();

  const uploadedRecordings: { storage_path: string; duration_ms?: number }[] = [];
  const uploadedImages: { storage_path: string }[] = [];
  const uploadedVideos: { storage_path: string; thumbnail_storage_path: string; duration_ms: number }[] = [];

  try {
    for (const recording of draftRecordings) {
      const path = `${session.user.id}/${Crypto.randomUUID()}.m4a`;
      const file = new File(recording.uri);
      const bytes = await file.bytes();
      const { error: uploadError } = await supabase.storage
        .from("notes-voice")
        .upload(path, bytes, { contentType: "audio/m4a" });
      if (uploadError) throw uploadError;
      uploadedRecordings.push({ storage_path: path, duration_ms: recording.durationMs });
    }

    for (const image of draftImages) {
      const ext = image.uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      const path = `${session.user.id}/${Crypto.randomUUID()}.${ext}`;
      const file = new File(image.uri);
      const bytes = await file.bytes();
      const { error: uploadError } = await supabase.storage
        .from("notes-images")
        .upload(path, bytes, { contentType: mimeType });
      if (uploadError) throw uploadError;
      uploadedImages.push({ storage_path: path });
    }

    for (const video of draftVideos) {
      const videoPath = `${session.user.id}/${Crypto.randomUUID()}.mp4`;
      const thumbPath = `${session.user.id}/${Crypto.randomUUID()}-thumb.jpg`;
      const videoFile = new File(video.uri);
      const videoBytes = await videoFile.bytes();
      const { error: videoUploadError } = await supabase.storage
        .from("media-videos")
        .upload(videoPath, videoBytes, { contentType: "video/mp4" });
      if (videoUploadError) throw videoUploadError;
      const thumbFile = new File(video.thumbnailUri);
      const thumbBytes = await thumbFile.bytes();
      const { error: thumbUploadError } = await supabase.storage
        .from("media-videos")
        .upload(thumbPath, thumbBytes, { contentType: "image/jpeg" });
      if (thumbUploadError) throw thumbUploadError;
      uploadedVideos.push({ storage_path: videoPath, thumbnail_storage_path: thumbPath, duration_ms: video.durationMs });
    }

    const { error } = await supabase.rpc("gym_save_session", {
      p_exercises: exercises,
      p_notes: notes,
      p_duration: duration,
      p_title: title,
      p_start_time: start_time,
      p_end_time: end_time,
      p_images: uploadedImages,
      p_videos: uploadedVideos,
      p_recordings: uploadedRecordings,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    if (uploadedRecordings.length > 0) {
      await supabase.storage.from("notes-voice").remove(uploadedRecordings.map((r) => r.storage_path));
    }
    if (uploadedImages.length > 0) {
      await supabase.storage.from("notes-images").remove(uploadedImages.map((r) => r.storage_path));
    }
    if (uploadedVideos.length > 0) {
      const paths = uploadedVideos.flatMap((v) => [v.storage_path, v.thumbnail_storage_path]);
      await supabase.storage.from("media-videos").remove(paths);
    }
    handleError(error, {
      message: "Error saving session",
      route: "/database/gym/save-session",
      method: "POST",
    });
    throw new Error("Error saving session");
  }
}
