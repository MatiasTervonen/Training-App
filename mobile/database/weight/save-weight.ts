import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
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
  weight: number | undefined;
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
  draftRecordings?: DraftRecording[];
};

export async function saveWeight({
  title,
  notes,
  weight,
  draftImages = [],
  draftVideos = [],
  draftRecordings = [],
}: props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

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

    const { error } = await supabase.rpc("weight_save_weight", {
      p_title: title,
      p_notes: notes,
      p_weight: weight,
      p_images: uploadedImages,
      p_videos: uploadedVideos,
      p_recordings: uploadedRecordings,
    });

    if (error) {
      throw error;
    }

    return true;
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
      message: "Error saving weight",
      route: "/database/weight/save-weight",
      method: "POST",
    });
    throw new Error("Error saving weight");
  }
}
