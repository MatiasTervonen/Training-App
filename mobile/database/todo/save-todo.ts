import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { uploadFileToStorage, getAccessToken } from "@/lib/upload-with-progress";
import { DraftRecording, DraftImage, DraftVideo } from "@/types/session";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";

type TodoTask = {
  task: string;
  notes: string | null;
  draftRecordings?: DraftRecording[];
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
};

type saveTodoToDBProps = {
  title: string;
  todoList: TodoTask[];
  onProgress?: (progress: number | undefined) => void;
};

async function getFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && "size" in info ? (info.size ?? 0) : 0;
}

export async function saveTodoToDB({
  title,
  todoList,
  onProgress,
}: saveTodoToDBProps) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const accessToken = await getAccessToken();

  const uploadedVoicePaths: string[] = [];
  const uploadedImagePaths: string[] = [];
  const uploadedVideoPaths: string[] = [];

  try {
    // Calculate total bytes across all tasks for progress tracking
    const allUris: string[] = [];
    for (const task of todoList) {
      allUris.push(...(task.draftRecordings ?? []).map((r) => r.uri));
      allUris.push(...(task.draftImages ?? []).map((i) => i.uri));
      for (const v of task.draftVideos ?? []) {
        allUris.push(v.uri, v.thumbnailUri);
      }
    }
    const sizes = await Promise.all(allUris.map(getFileSize));
    const totalBytes = sizes.reduce((a, b) => a + b, 0);
    if (totalBytes > 0) onProgress?.(0);

    // Track per-file progress for parallel uploads
    const fileProgress = new Map<string, number>();
    let fileCounter = 0;
    const updateProgress = () => {
      const loaded = Array.from(fileProgress.values()).reduce((a, b) => a + b, 0);
      onProgress?.(totalBytes > 0 ? loaded / totalBytes : 0);
    };
    const makeHandler = (key: string) => (loaded: number) => {
      fileProgress.set(key, loaded);
      updateProgress();
    };

    // Build task jsonb with uploaded media storage paths
    const tasksWithMedia = [];

    for (const task of todoList) {
      // Upload all media for this task in parallel
      const [voice, images, videos] = await Promise.all([
        // Voice recordings
        Promise.all(
          (task.draftRecordings ?? []).map(async (recording) => {
            const path = `${session.user.id}/${Crypto.randomUUID()}.m4a`;
            const key = `f-${fileCounter++}`;
            fileProgress.set(key, 0);

            await uploadFileToStorage("notes-voice", path, recording.uri, "audio/m4a", accessToken, makeHandler(key));

            uploadedVoicePaths.push(path);
            return { storage_path: path, duration_ms: recording.durationMs };
          }),
        ),
        // Images
        Promise.all(
          (task.draftImages ?? []).map(async (image) => {
            const ext = image.uri.split(".").pop()?.toLowerCase() ?? "jpg";
            const mimeType =
              ext === "png"
                ? "image/png"
                : ext === "webp"
                  ? "image/webp"
                  : "image/jpeg";
            const path = `${session.user.id}/${Crypto.randomUUID()}.${ext}`;
            const key = `f-${fileCounter++}`;
            fileProgress.set(key, 0);

            await uploadFileToStorage("notes-images", path, image.uri, mimeType, accessToken, makeHandler(key));

            uploadedImagePaths.push(path);
            return { storage_path: path };
          }),
        ),
        // Videos
        Promise.all(
          (task.draftVideos ?? []).map(async (video) => {
            const videoPath = `${session.user.id}/${Crypto.randomUUID()}.mp4`;
            const thumbPath = `${session.user.id}/${Crypto.randomUUID()}-thumb.jpg`;

            const videoKey = `f-${fileCounter++}`;
            const thumbKey = `f-${fileCounter++}`;
            fileProgress.set(videoKey, 0);
            fileProgress.set(thumbKey, 0);

            await Promise.all([
              uploadFileToStorage("media-videos", videoPath, video.uri, "video/mp4", accessToken, makeHandler(videoKey)),
              uploadFileToStorage("media-videos", thumbPath, video.thumbnailUri, "image/jpeg", accessToken, makeHandler(thumbKey)),
            ]);

            uploadedVideoPaths.push(videoPath, thumbPath);
            return {
              storage_path: videoPath,
              thumbnail_storage_path: thumbPath,
              duration_ms: video.durationMs,
            };
          }),
        ),
      ]);

      tasksWithMedia.push({
        task: task.task,
        notes: task.notes,
        voice: voice.length > 0 ? voice : undefined,
        images: images.length > 0 ? images : undefined,
        videos: videos.length > 0 ? videos : undefined,
      });
    }

    onProgress?.(undefined);

    const { error } = await supabase.rpc("todo_save_todo", {
      p_title: title,
      p_todo_list: tasksWithMedia,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    // Cleanup orphaned uploads
    if (uploadedVoicePaths.length > 0) {
      await supabase.storage.from("notes-voice").remove(uploadedVoicePaths);
    }
    if (uploadedImagePaths.length > 0) {
      await supabase.storage.from("notes-images").remove(uploadedImagePaths);
    }
    if (uploadedVideoPaths.length > 0) {
      await supabase.storage.from("media-videos").remove(uploadedVideoPaths);
    }

    console.error("Error saving todo", error);
    handleError(error, {
      message: "Error saving todo",
      route: "/database/todo/save-todo",
      method: "POST",
    });
    throw new Error("Error saving todo");
  }
}
