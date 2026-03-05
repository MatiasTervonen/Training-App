import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { DraftRecording, DraftImage, DraftVideo } from "@/types/session";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system/next";

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
};

export async function saveTodoToDB({
  title,
  todoList,
}: saveTodoToDBProps) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const uploadedVoicePaths: string[] = [];
  const uploadedImagePaths: string[] = [];
  const uploadedVideoPaths: string[] = [];

  try {
    // Build task jsonb with uploaded media storage paths
    const tasksWithMedia = [];

    for (const task of todoList) {
      // Upload all media for this task in parallel
      const [voice, images, videos] = await Promise.all([
        // Voice recordings
        Promise.all(
          (task.draftRecordings ?? []).map(async (recording) => {
            const path = `${session.user.id}/${Crypto.randomUUID()}.m4a`;
            const file = new File(recording.uri);
            const bytes = await file.bytes();

            const { error: uploadError } = await supabase.storage
              .from("notes-voice")
              .upload(path, bytes, { contentType: "audio/m4a" });

            if (uploadError) throw uploadError;

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

            const file = new File(image.uri);
            const bytes = await file.bytes();

            const { error: uploadError } = await supabase.storage
              .from("notes-images")
              .upload(path, bytes, { contentType: mimeType });

            if (uploadError) throw uploadError;

            uploadedImagePaths.push(path);
            return { storage_path: path };
          }),
        ),
        // Videos
        Promise.all(
          (task.draftVideos ?? []).map(async (video) => {
            const videoPath = `${session.user.id}/${Crypto.randomUUID()}.mp4`;
            const thumbPath = `${session.user.id}/${Crypto.randomUUID()}-thumb.jpg`;

            const videoFile = new File(video.uri);
            const thumbFile = new File(video.thumbnailUri);

            const [videoBytes, thumbBytes] = await Promise.all([
              videoFile.bytes(),
              thumbFile.bytes(),
            ]);

            const [videoResult, thumbResult] = await Promise.all([
              supabase.storage
                .from("media-videos")
                .upload(videoPath, videoBytes, { contentType: "video/mp4" }),
              supabase.storage
                .from("media-videos")
                .upload(thumbPath, thumbBytes, { contentType: "image/jpeg" }),
            ]);

            if (videoResult.error) throw videoResult.error;
            if (thumbResult.error) throw thumbResult.error;

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
