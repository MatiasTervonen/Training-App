import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { DraftRecording, DraftImage, DraftVideo } from "@/types/session";
import { prepareAndEnqueueMedia } from "@/lib/upload-queue-helpers";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system/next";

type TodoTaskEdit = {
  id: string | null;
  tempId?: string;
  task: string;
  notes: string | null;
  position: number;
  updated_at: string;
  newRecordings?: DraftRecording[];
  newImages?: DraftImage[];
  newVideos?: DraftVideo[];
};

type TodoListEdit = {
  id: string;
  title: string;
  tasks: TodoTaskEdit[];
  deletedIds: string[];
  updated_at: string;
  deletedVoiceIds?: string[];
  deletedVoicePaths?: string[];
  deletedImageIds?: string[];
  deletedImagePaths?: string[];
  deletedVideoIds?: string[];
  deletedVideoPaths?: string[];
};

export async function editTodo({
  id,
  title,
  tasks,
  deletedIds,
  updated_at,
  deletedVoiceIds = [],
  deletedVoicePaths = [],
  deletedImageIds = [],
  deletedImagePaths = [],
  deletedVideoIds = [],
  deletedVideoPaths = [],
}: TodoListEdit) {
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

    for (const task of tasks) {
      // Upload all new media for this task in parallel
      const [newVoice, newImages, newVideos] = await Promise.all([
        // Voice recordings
        Promise.all(
          (task.newRecordings ?? []).map(async (recording) => {
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
          (task.newImages ?? []).map(async (image) => {
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
          (task.newVideos ?? []).map(async (video) => {
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
        id: task.id,
        temp_id: task.tempId ?? undefined,
        task: task.task,
        notes: task.notes,
        position: task.position,
        updated_at: task.updated_at,
        new_voice: newVoice.length > 0 ? newVoice : undefined,
        new_images: newImages.length > 0 ? newImages : undefined,
        new_videos: newVideos.length > 0 ? newVideos : undefined,
      });
    }

    const { data, error } = await supabase.rpc("todo_edit_todo", {
      p_id: id,
      p_title: title,
      p_tasks: tasksWithMedia,
      p_deleted_ids: deletedIds,
      p_updated_at: updated_at,
      p_deleted_voice_ids: deletedVoiceIds,
      p_deleted_image_ids: deletedImageIds,
      p_deleted_video_ids: deletedVideoIds,
    });

    if (error) throw error;

    // Clean up storage files for deleted media (fire-and-forget)
    if (deletedVoicePaths.length > 0) {
      supabase.storage.from("notes-voice").remove(deletedVoicePaths);
    }
    if (deletedImagePaths.length > 0) {
      supabase.storage.from("notes-images").remove(deletedImagePaths);
    }
    if (deletedVideoPaths.length > 0) {
      supabase.storage.from("media-videos").remove(deletedVideoPaths);
    }

    return data;
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

    console.error("Error editing todo", error);
    handleError(error, {
      message: "Error editing todo list",
      route: "/database/todo/edit-todo",
      method: "RPC",
    });
    throw new Error("Error editing todo list");
  }
}

type EditTodoWithoutMediaResult = {
  feedItem: Record<string, unknown>;
  newTaskIds: Record<string, string>;
};

/**
 * Saves the todo edit to the database immediately (no media uploads),
 * then enqueues new media for background upload via the upload queue.
 * Returns the feed_item and a mapping of temp_id → real DB task_id for new tasks.
 */
export async function editTodoWithoutMedia({
  id,
  title,
  tasks,
  deletedIds,
  updated_at,
  deletedVoiceIds = [],
  deletedVoicePaths = [],
  deletedImageIds = [],
  deletedImagePaths = [],
  deletedVideoIds = [],
  deletedVideoPaths = [],
}: TodoListEdit): Promise<EditTodoWithoutMediaResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  // Build task jsonb WITHOUT media
  const tasksForRpc = tasks.map((task) => ({
    id: task.id,
    temp_id: task.tempId ?? undefined,
    task: task.task,
    notes: task.notes,
    position: task.position,
    updated_at: task.updated_at,
  }));

  const { data, error } = await supabase.rpc("todo_edit_todo", {
    p_id: id,
    p_title: title,
    p_tasks: tasksForRpc,
    p_deleted_ids: deletedIds,
    p_updated_at: updated_at,
    p_deleted_voice_ids: deletedVoiceIds,
    p_deleted_image_ids: deletedImageIds,
    p_deleted_video_ids: deletedVideoIds,
  });

  if (error) {
    handleError(error, {
      message: "Error editing todo list",
      route: "/database/todo/edit-todo",
      method: "RPC",
    });
    throw new Error("Error editing todo list");
  }

  const result = data as {
    feed_item: Record<string, unknown>;
    new_task_ids: Record<string, string>;
  };

  // Clean up storage files for deleted media (fire-and-forget)
  if (deletedVoicePaths.length > 0) {
    supabase.storage.from("notes-voice").remove(deletedVoicePaths);
  }
  if (deletedImagePaths.length > 0) {
    supabase.storage.from("notes-images").remove(deletedImagePaths);
  }
  if (deletedVideoPaths.length > 0) {
    supabase.storage.from("media-videos").remove(deletedVideoPaths);
  }

  // Enqueue media for background upload
  for (const task of tasks) {
    const hasNewMedia =
      (task.newRecordings?.length ?? 0) > 0 ||
      (task.newImages?.length ?? 0) > 0 ||
      (task.newVideos?.length ?? 0) > 0;

    if (!hasNewMedia) continue;

    // Resolve the task ID: existing tasks have id, new tasks use the mapping
    const taskId = task.id ?? (task.tempId ? result.new_task_ids[task.tempId] : null);
    if (!taskId) continue;

    await prepareAndEnqueueMedia({
      targetId: taskId,
      targetType: "todo_task",
      draftImages: task.newImages,
      draftRecordings: task.newRecordings,
      draftVideos: task.newVideos,
      userId: session.user.id,
    });
  }

  return {
    feedItem: result.feed_item,
    newTaskIds: result.new_task_ids,
  };
}
