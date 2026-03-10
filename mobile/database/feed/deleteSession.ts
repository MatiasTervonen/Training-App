import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type MediaPaths = {
  voicePaths: string[];
  imagePaths: string[];
  videoPaths: string[];
};

async function getMediaPaths(id: string, type: string): Promise<MediaPaths> {
  const voicePaths: string[] = [];
  const imagePaths: string[] = [];
  const videoPaths: string[] = [];

  if (type === "activity_sessions" || type === "gym_sessions") {
    const [voice, images, videos] = await Promise.all([
      supabase.from("sessions_voice").select("storage_path").eq("session_id", id),
      supabase.from("session_images").select("storage_path").eq("session_id", id),
      supabase.from("session_videos").select("storage_path, thumbnail_storage_path").eq("session_id", id),
    ]);
    voicePaths.push(...(voice.data ?? []).map((r) => r.storage_path).filter(Boolean) as string[]);
    imagePaths.push(...(images.data ?? []).map((r) => r.storage_path).filter(Boolean) as string[]);
    for (const v of videos.data ?? []) {
      if (v.storage_path) videoPaths.push(v.storage_path);
      if (v.thumbnail_storage_path) videoPaths.push(v.thumbnail_storage_path);
    }
  } else if (type === "notes") {
    const [voice, images, videos] = await Promise.all([
      supabase.from("notes_voice").select("storage_path").eq("note_id", id),
      supabase.from("notes_images").select("storage_path").eq("note_id", id),
      supabase.from("notes_videos").select("storage_path, thumbnail_storage_path").eq("note_id", id),
    ]);
    voicePaths.push(...(voice.data ?? []).map((r) => r.storage_path).filter(Boolean) as string[]);
    imagePaths.push(...(images.data ?? []).map((r) => r.storage_path).filter(Boolean) as string[]);
    for (const v of videos.data ?? []) {
      if (v.storage_path) videoPaths.push(v.storage_path);
      if (v.thumbnail_storage_path) videoPaths.push(v.thumbnail_storage_path);
    }
  } else if (type === "weight") {
    const [voice, images, videos] = await Promise.all([
      supabase.from("weight_voice").select("storage_path").eq("weight_id", id),
      supabase.from("weight_images").select("storage_path").eq("weight_id", id),
      supabase.from("weight_videos").select("storage_path, thumbnail_storage_path").eq("weight_id", id),
    ]);
    voicePaths.push(...(voice.data ?? []).map((r) => r.storage_path).filter(Boolean) as string[]);
    imagePaths.push(...(images.data ?? []).map((r) => r.storage_path).filter(Boolean) as string[]);
    for (const v of videos.data ?? []) {
      if (v.storage_path) videoPaths.push(v.storage_path);
      if (v.thumbnail_storage_path) videoPaths.push(v.thumbnail_storage_path);
    }
  } else if (type === "todo_lists") {
    const { data: tasks } = await supabase
      .from("todo_tasks")
      .select("id")
      .eq("list_id", id);
    const taskIds = (tasks ?? []).map((t) => t.id);
    if (taskIds.length > 0) {
      const [voice, images, videos] = await Promise.all([
        supabase.from("todo_task_voice").select("storage_path").in("task_id", taskIds),
        supabase.from("todo_task_images").select("storage_path").in("task_id", taskIds),
        supabase.from("todo_task_videos").select("storage_path, thumbnail_storage_path").in("task_id", taskIds),
      ]);
      voicePaths.push(...(voice.data ?? []).map((r) => r.storage_path).filter(Boolean) as string[]);
      imagePaths.push(...(images.data ?? []).map((r) => r.storage_path).filter(Boolean) as string[]);
      for (const v of videos.data ?? []) {
        if (v.storage_path) videoPaths.push(v.storage_path);
        if (v.thumbnail_storage_path) videoPaths.push(v.thumbnail_storage_path);
      }
    }
  }

  return { voicePaths, imagePaths, videoPaths };
}

async function cleanupStorage(paths: MediaPaths) {
  const promises: Promise<unknown>[] = [];

  if (paths.voicePaths.length > 0) {
    promises.push(supabase.storage.from("notes-voice").remove(paths.voicePaths));
  }
  if (paths.imagePaths.length > 0) {
    promises.push(supabase.storage.from("notes-images").remove(paths.imagePaths));
  }
  if (paths.videoPaths.length > 0) {
    promises.push(supabase.storage.from("media-videos").remove(paths.videoPaths));
  }

  await Promise.all(promises);
}

export async function deleteSession(id: string, type: string) {
  // Fetch media paths before deleting DB records
  try {
    const mediaPaths = await getMediaPaths(id, type);
    await cleanupStorage(mediaPaths);
  } catch {
    // Storage cleanup is best-effort; continue with DB deletion
  }

  const { error } = await supabase.rpc("feed_delete_session", {
    p_id: id,
    p_type: type,
  });

  if (error) {
    handleError(error, {
      message: "Error deleting session",
      route: "/database/feed/deleteSession",
      method: "DELETE",
    });
    throw new Error("Error deleting session");
  }

  return { success: true };
}
