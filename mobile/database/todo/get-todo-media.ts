import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type TodoTaskMedia = {
  [taskId: string]: {
    voice: {
      id: string;
      uri: string;
      storage_path: string;
      duration_ms: number | null;
    }[];
    images: { id: string; uri: string; storage_path: string }[];
    videos: {
      id: string;
      uri: string;
      thumbnailUri: string;
      storage_path: string;
      duration_ms: number | null;
    }[];
  };
};

export async function getFullTodoMedia(
  listId: string,
): Promise<TodoTaskMedia> {
  // Get all task IDs for this list
  const { data: tasks, error: tasksError } = await supabase
    .from("todo_tasks")
    .select("id")
    .eq("list_id", listId);

  if (tasksError) {
    handleError(tasksError, {
      message: "Error fetching todo tasks",
      route: "/database/todo/get-todo-media",
      method: "GET",
    });
    throw new Error("Error fetching todo tasks");
  }

  const taskIds = (tasks ?? []).map((t) => t.id);
  if (taskIds.length === 0) return {};

  // Fetch all media in parallel
  const [voiceResult, imageResult, videoResult] = await Promise.all([
    supabase
      .from("todo_task_voice" as "notes_voice")
      .select("id, task_id, storage_path, duration_ms")
      .in("task_id", taskIds) as unknown as {
        data: { id: string; task_id: string; storage_path: string; duration_ms: number | null }[] | null;
        error: { message: string } | null;
      },
    supabase
      .from("todo_task_images" as "notes_voice")
      .select("id, task_id, storage_path")
      .in("task_id", taskIds) as unknown as {
        data: { id: string; task_id: string; storage_path: string }[] | null;
        error: { message: string } | null;
      },
    supabase
      .from("todo_task_videos" as "notes_voice")
      .select("id, task_id, storage_path, thumbnail_storage_path, duration_ms")
      .in("task_id", taskIds) as unknown as {
        data: { id: string; task_id: string; storage_path: string; thumbnail_storage_path: string | null; duration_ms: number | null }[] | null;
        error: { message: string } | null;
      },
  ]);

  if (voiceResult.error) {
    handleError(voiceResult.error, {
      message: "Error fetching todo voice recordings",
      route: "/database/todo/get-todo-media",
      method: "GET",
    });
    throw new Error("Error fetching todo voice recordings");
  }

  if (imageResult.error) {
    handleError(imageResult.error, {
      message: "Error fetching todo images",
      route: "/database/todo/get-todo-media",
      method: "GET",
    });
    throw new Error("Error fetching todo images");
  }

  if (videoResult.error) {
    handleError(videoResult.error, {
      message: "Error fetching todo videos",
      route: "/database/todo/get-todo-media",
      method: "GET",
    });
    throw new Error("Error fetching todo videos");
  }

  // Generate signed URLs
  const voiceWithUrls = await Promise.all(
    (voiceResult.data ?? []).map(async (voice) => {
      const { data: urlData } = await supabase.storage
        .from("notes-voice")
        .createSignedUrl(voice.storage_path, 3600);
      return { ...voice, uri: urlData?.signedUrl ?? "" };
    }),
  );

  const imagesWithUrls = await Promise.all(
    (imageResult.data ?? []).map(async (image) => {
      const { data: urlData } = await supabase.storage
        .from("notes-images")
        .createSignedUrl(image.storage_path, 3600);
      return { ...image, uri: urlData?.signedUrl ?? "" };
    }),
  );

  const videosWithUrls = await Promise.all(
    (videoResult.data ?? []).map(async (video) => {
      const [videoUrlResult, thumbUrlResult] = await Promise.all([
        supabase.storage
          .from("media-videos")
          .createSignedUrl(video.storage_path, 3600),
        video.thumbnail_storage_path
          ? supabase.storage
              .from("media-videos")
              .createSignedUrl(video.thumbnail_storage_path, 3600)
          : Promise.resolve({ data: null }),
      ]);

      return {
        ...video,
        uri: videoUrlResult.data?.signedUrl ?? "",
        thumbnailUri: thumbUrlResult.data?.signedUrl ?? "",
      };
    }),
  );

  // Pre-group by task_id using Maps for O(1) lookup
  type VoiceItem = (typeof voiceWithUrls)[number];
  type ImageItem = (typeof imagesWithUrls)[number];
  type VideoItem = (typeof videosWithUrls)[number];

  const voiceByTask = new Map<string, VoiceItem[]>();
  for (const v of voiceWithUrls) {
    if (v.uri === "") continue;
    const arr = voiceByTask.get(v.task_id) ?? [];
    arr.push(v);
    voiceByTask.set(v.task_id, arr);
  }

  const imagesByTask = new Map<string, ImageItem[]>();
  for (const img of imagesWithUrls) {
    if (img.uri === "") continue;
    const arr = imagesByTask.get(img.task_id) ?? [];
    arr.push(img);
    imagesByTask.set(img.task_id, arr);
  }

  const videosByTask = new Map<string, VideoItem[]>();
  for (const v of videosWithUrls) {
    if (v.uri === "") continue;
    const arr = videosByTask.get(v.task_id) ?? [];
    arr.push(v);
    videosByTask.set(v.task_id, arr);
  }

  // Build result from Maps
  const result: TodoTaskMedia = {};

  for (const taskId of taskIds) {
    result[taskId] = {
      voice: (voiceByTask.get(taskId) ?? []).map(
        ({ id, uri, storage_path, duration_ms }) => ({
          id,
          uri,
          storage_path,
          duration_ms,
        }),
      ),
      images: (imagesByTask.get(taskId) ?? []).map(
        ({ id, uri, storage_path }) => ({ id, uri, storage_path }),
      ),
      videos: (videosByTask.get(taskId) ?? []).map(
        ({ id, uri, thumbnailUri, storage_path, duration_ms }) => ({
          id,
          uri,
          thumbnailUri,
          storage_path,
          duration_ms,
        }),
      ),
    };
  }

  return result;
}
