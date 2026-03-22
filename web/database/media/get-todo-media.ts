import { createClient } from "@/utils/supabase/client";
import { fetchAndSignMedia } from "@/database/media/get-signed-urls";
import type { TodoTaskMedia } from "@/types/media";

/** Fetch media for all tasks in a todo list */
export async function getTodoMedia(
  taskIds: string[],
): Promise<TodoTaskMedia> {
  if (taskIds.length === 0) return {};

  const supabase = createClient();

  const [imageRes, videoRes, voiceRes] = await Promise.all([
    supabase
      .from("todo_task_images")
      .select("id, task_id, storage_path")
      .in("task_id", taskIds),
    supabase
      .from("todo_task_videos")
      .select("id, task_id, storage_path, thumbnail_storage_path, duration_ms")
      .in("task_id", taskIds),
    supabase
      .from("todo_task_voice")
      .select("id, task_id, storage_path, duration_ms")
      .in("task_id", taskIds),
  ]);

  const images = imageRes.data ?? [];
  const videos = videoRes.data ?? [];
  const voice = voiceRes.data ?? [];

  // Group by task_id and sign URLs
  const allTaskIds = new Set([
    ...images.map((i) => i.task_id),
    ...videos.map((v) => v.task_id),
    ...voice.map((v) => v.task_id),
  ]);

  const result: TodoTaskMedia = {};

  await Promise.all(
    Array.from(allTaskIds).map(async (taskId) => {
      const taskImages = images.filter((i) => i.task_id === taskId);
      const taskVideos = videos.filter((v) => v.task_id === taskId);
      const taskVoice = voice.filter((v) => v.task_id === taskId);

      result[taskId] = await fetchAndSignMedia(
        taskImages,
        taskVideos,
        taskVoice,
      );
    }),
  );

  return result;
}
