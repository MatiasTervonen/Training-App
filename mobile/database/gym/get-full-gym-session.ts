import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { useUserStore } from "@/lib/stores/useUserStore";

export type SessionImage = {
  id: string;
  storage_path: string;
  uri: string;
};

export type SessionVideo = {
  id: string;
  storage_path: string;
  thumbnailUri: string;
  uri: string;
  duration_ms: number | null;
};

export type SessionVoiceRecording = {
  id: string;
  storage_path: string;
  duration_ms: number | null;
  uri: string;
};

export async function getFullGymSession(sessionId: string) {
  if (!sessionId) {
    throw new Error("Missing session ID");
  }

  const language = useUserStore.getState().settings?.language ?? "en";

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `*, session_stats(*), gym_session_exercises(
        *,
        gym_exercises(
          *,
          gym_exercises_translations!inner(name)
        ),
        gym_sets(*)
      )`,
    )
    .eq(
      "gym_session_exercises.gym_exercises.gym_exercises_translations.language",
      language,
    )
    .order("position", {
      referencedTable: "gym_session_exercises",
      ascending: true,
    })
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    console.error("Error fetching gym session:", error);
    handleError(error, {
      message: "Error fetching gym session",
      route: "/database/gym/get-full-gym-session",
      method: "GET",
    });
    throw new Error("Error fetching gym session");
  }

  // Map the result to extract translated name from gym_exercises_translations
  data.gym_session_exercises = data.gym_session_exercises.map(
    (exercise) => ({
      ...exercise,
      gym_exercises: {
        ...exercise.gym_exercises,
        name:
          exercise.gym_exercises?.gym_exercises_translations?.[0]?.name ??
          "Unknown",
      },
    }),
  );

  data.gym_session_exercises.forEach((exercise) => {
    if (Array.isArray(exercise.gym_sets)) {
      exercise.gym_sets = [...exercise.gym_sets].sort(
        (a, b) => a.set_number - b.set_number,
      );
    }
  });

  // Fetch session media
  const [imageResult, videoResult, voiceResult] = await Promise.all([
    supabase
      .from("session_images" as "sessions")
      .select("id, storage_path")
      .eq("session_id", sessionId) as unknown as Promise<{
        data: { id: string; storage_path: string }[] | null;
        error: { message: string } | null;
      }>,
    supabase
      .from("session_videos" as "sessions")
      .select("id, storage_path, thumbnail_storage_path, duration_ms")
      .eq("session_id", sessionId) as unknown as Promise<{
        data: { id: string; storage_path: string; thumbnail_storage_path: string | null; duration_ms: number | null }[] | null;
        error: { message: string } | null;
      }>,
    supabase
      .from("sessions_voice")
      .select("id, storage_path, duration_ms")
      .eq("session_id", sessionId),
  ]);

  const images: SessionImage[] = await Promise.all(
    (imageResult.data ?? []).map(async (img) => {
      const { data: urlData } = await supabase.storage
        .from("notes-images")
        .createSignedUrl(img.storage_path, 3600);
      return { id: img.id, storage_path: img.storage_path, uri: urlData?.signedUrl ?? "" };
    }),
  );

  const videos: SessionVideo[] = await Promise.all(
    (videoResult.data ?? []).map(async (vid) => {
      const { data: videoUrlData } = await supabase.storage
        .from("media-videos")
        .createSignedUrl(vid.storage_path, 3600);
      const thumbnailUri = vid.thumbnail_storage_path
        ? (await supabase.storage.from("media-videos").createSignedUrl(vid.thumbnail_storage_path, 3600)).data?.signedUrl ?? ""
        : "";
      return { id: vid.id, storage_path: vid.storage_path, uri: videoUrlData?.signedUrl ?? "", thumbnailUri, duration_ms: vid.duration_ms };
    }),
  );

  const voiceRecordings: SessionVoiceRecording[] = await Promise.all(
    (voiceResult.data ?? []).map(async (v) => {
      const { data: urlData } = await supabase.storage
        .from("notes-voice")
        .createSignedUrl(v.storage_path, 3600);
      return { id: v.id, storage_path: v.storage_path, duration_ms: v.duration_ms, uri: urlData?.signedUrl ?? "" };
    }),
  );

  return {
    ...data,
    sessionImages: images.filter((img) => img.uri !== ""),
    sessionVideos: videos.filter((v) => v.uri !== ""),
    sessionVoiceRecordings: voiceRecordings.filter((v) => v.uri !== ""),
  };
}

export type FullGymSession = NonNullable<
  Awaited<ReturnType<typeof getFullGymSession>>
>;
