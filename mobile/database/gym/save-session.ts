import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { uploadFileToStorage } from "@/lib/upload-with-progress";
import { useTimerStore } from "@/lib/stores/timerStore";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";
import { DraftVideo, ExerciseEntry } from "@/types/session";
import { prepareAndEnqueueMedia } from "@/lib/upload-queue-helpers";

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

type PhasePayload = {
  phase_type: string;
  activity_id: string;
  duration_seconds: number;
  steps: number | null;
  distance_meters: number | null;
  is_manual: boolean;
};

type props = {
  title: string;
  notes: string;
  duration: number;
  exercises: ExerciseEntry[];
  draftImages?: DraftImage[];
  draftRecordings?: DraftRecording[];
  draftVideos?: DraftVideo[];
  onProgress?: (progress: number | undefined) => void;
  phases?: PhasePayload[];
};

async function getFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && "size" in info ? (info.size ?? 0) : 0;
}

export async function saveSession({
  exercises,
  notes,
  duration,
  title,
  draftImages = [],
  draftRecordings = [],
  draftVideos = [],
  onProgress,
  phases = [],
}: props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const accessToken = session.access_token;

  const start_time = new Date(
    useTimerStore.getState().activeSession?.started_at ?? Date.now(),
  ).toISOString();
  const end_time = new Date().toISOString();

  const uploadedRecordings: { storage_path: string; duration_ms?: number }[] = [];
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
    let completedBytes = 0;
    let sizeIndex = 0;

    const makeProgressHandler = (fileSize: number) => {
      return (loaded: number) => {
        onProgress?.((completedBytes + Math.min(loaded, fileSize)) / totalBytes);
      };
    };

    const advanceCompleted = (fileSize: number) => {
      completedBytes += fileSize;
      onProgress?.(completedBytes / totalBytes);
    };

    for (const recording of draftRecordings) {
      const path = `${session.user.id}/${Crypto.randomUUID()}.m4a`;
      const fileSize = sizes[sizeIndex++];
      await uploadFileToStorage("notes-voice", path, recording.uri, "audio/m4a", accessToken, makeProgressHandler(fileSize));
      advanceCompleted(fileSize);
      uploadedRecordings.push({ storage_path: path, duration_ms: recording.durationMs });
    }

    for (const image of draftImages) {
      const ext = image.uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      const path = `${session.user.id}/${Crypto.randomUUID()}.${ext}`;
      const fileSize = sizes[sizeIndex++];
      await uploadFileToStorage("notes-images", path, image.uri, mimeType, accessToken, makeProgressHandler(fileSize));
      advanceCompleted(fileSize);
      uploadedImages.push({ storage_path: path });
    }

    for (const video of draftVideos) {
      const videoPath = `${session.user.id}/${Crypto.randomUUID()}.mp4`;
      const thumbPath = `${session.user.id}/${Crypto.randomUUID()}-thumb.jpg`;
      const videoSize = sizes[sizeIndex++];
      const thumbSize = sizes[sizeIndex++];

      await uploadFileToStorage("media-videos", videoPath, video.uri, "video/mp4", accessToken, makeProgressHandler(videoSize));
      advanceCompleted(videoSize);

      await uploadFileToStorage("media-videos", thumbPath, video.thumbnailUri, "image/jpeg", accessToken, makeProgressHandler(thumbSize));
      advanceCompleted(thumbSize);

      uploadedVideos.push({ storage_path: videoPath, thumbnail_storage_path: thumbPath, duration_ms: video.durationMs });
    }

    onProgress?.(undefined);

    const { data: sessionId, error } = await supabase.rpc("gym_save_session", {
      p_exercises: exercises,
      p_notes: notes,
      p_duration: duration,
      p_title: title,
      p_start_time: start_time,
      p_end_time: end_time,
      p_images: uploadedImages,
      p_videos: uploadedVideos,
      p_recordings: uploadedRecordings,
      p_phases: phases,
    });

    if (error) {
      throw error;
    }

    return { success: true, sessionId: sessionId as string };
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

type SaveWithoutMediaProps = {
  title: string;
  notes: string;
  duration: number;
  exercises: ExerciseEntry[];
  phases?: PhasePayload[];
  draftImages?: DraftImage[];
  draftRecordings?: DraftRecording[];
  draftVideos?: DraftVideo[];
};

/**
 * Saves the session to the database immediately (no media uploads),
 * then enqueues media for background upload via the upload queue.
 */
export async function saveSessionWithoutMedia({
  exercises,
  notes,
  duration,
  title,
  phases = [],
  draftImages = [],
  draftRecordings = [],
  draftVideos = [],
}: SaveWithoutMediaProps) {
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

  const { data: sessionId, error } = await supabase.rpc("gym_save_session", {
    p_exercises: exercises,
    p_notes: notes,
    p_duration: duration,
    p_title: title,
    p_start_time: start_time,
    p_end_time: end_time,
    p_phases: phases,
  });

  if (error) {
    handleError(error, {
      message: "Error saving session",
      route: "/database/gym/save-session",
      method: "POST",
    });
    throw new Error("Error saving session");
  }

  const hasMedia =
    draftImages.length > 0 ||
    draftRecordings.length > 0 ||
    draftVideos.length > 0;

  if (hasMedia) {
    await prepareAndEnqueueMedia({
      targetId: sessionId as string,
      targetType: "session",
      draftImages,
      draftRecordings,
      draftVideos,
      userId: session.user.id,
    });
  }

  return { success: true, sessionId: sessionId as string, hasMedia };
}
