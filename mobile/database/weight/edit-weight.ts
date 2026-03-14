import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { uploadFileToStorage, getAccessToken } from "@/lib/upload-with-progress";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";

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

type DraftVideo = {
  id: string;
  uri: string;
  thumbnailUri: string;
  durationMs: number;
};

type Props = {
  id: string;
  title: string;
  notes: string;
  weight: number;
  updated_at: string;
  deletedRecordingIds?: string[];
  deletedRecordingPaths?: string[];
  newRecordings?: DraftRecording[];
  deletedImageIds?: string[];
  deletedImagePaths?: string[];
  newImages?: DraftImage[];
  deletedVideoIds?: string[];
  deletedVideoPaths?: string[];
  newVideos?: DraftVideo[];
  onProgress?: (progress: number | undefined) => void;
};

async function getFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && "size" in info ? (info.size ?? 0) : 0;
}

export async function editWeight({
  id,
  title,
  notes,
  weight,
  updated_at,
  deletedRecordingIds = [],
  deletedRecordingPaths = [],
  newRecordings = [],
  deletedImageIds = [],
  deletedImagePaths = [],
  newImages = [],
  deletedVideoIds = [],
  deletedVideoPaths = [],
  newVideos = [],
  onProgress,
}: Props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const accessToken = await getAccessToken();

  const uploadedRecordings: {
    storage_path: string;
    duration_ms?: number;
  }[] = [];

  const uploadedImages: {
    storage_path: string;
  }[] = [];

  const uploadedVideos: {
    storage_path: string;
    thumbnail_storage_path: string;
    duration_ms: number;
  }[] = [];

  try {
    // Calculate total bytes for progress tracking
    const allUris = [
      ...newRecordings.map((r) => r.uri),
      ...newImages.map((i) => i.uri),
      ...newVideos.flatMap((v) => [v.uri, v.thumbnailUri]),
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

    // Upload new recordings
    for (const recording of newRecordings) {
      const path = `${session.user.id}/${Crypto.randomUUID()}.m4a`;
      const fileSize = sizes[sizeIndex++];

      await uploadFileToStorage(
        "notes-voice",
        path,
        recording.uri,
        "audio/m4a",
        accessToken,
        makeProgressHandler(fileSize),
      );

      advanceCompleted(fileSize);
      uploadedRecordings.push({
        storage_path: path,
        duration_ms: recording.durationMs,
      });
    }

    // Upload new images
    for (const image of newImages) {
      const ext = image.uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const mimeType =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
      const path = `${session.user.id}/${Crypto.randomUUID()}.${ext}`;
      const fileSize = sizes[sizeIndex++];

      await uploadFileToStorage(
        "notes-images",
        path,
        image.uri,
        mimeType,
        accessToken,
        makeProgressHandler(fileSize),
      );

      advanceCompleted(fileSize);
      uploadedImages.push({ storage_path: path });
    }

    // Upload new videos
    for (const video of newVideos) {
      const videoPath = `${session.user.id}/${Crypto.randomUUID()}.mp4`;
      const thumbPath = `${session.user.id}/${Crypto.randomUUID()}-thumb.jpg`;
      const videoSize = sizes[sizeIndex++];
      const thumbSize = sizes[sizeIndex++];

      await uploadFileToStorage(
        "media-videos",
        videoPath,
        video.uri,
        "video/mp4",
        accessToken,
        makeProgressHandler(videoSize),
      );
      advanceCompleted(videoSize);

      await uploadFileToStorage(
        "media-videos",
        thumbPath,
        video.thumbnailUri,
        "image/jpeg",
        accessToken,
        makeProgressHandler(thumbSize),
      );
      advanceCompleted(thumbSize);

      uploadedVideos.push({
        storage_path: videoPath,
        thumbnail_storage_path: thumbPath,
        duration_ms: video.durationMs,
      });
    }

    // Switch to spinner for the DB save phase
    onProgress?.(undefined);

    const { data, error } = await supabase.rpc("weight_edit_weight", {
      p_id: id,
      p_title: title,
      p_notes: notes,
      p_weight: weight,
      p_updated_at: updated_at,
      p_deleted_recording_ids: deletedRecordingIds,
      p_new_recordings: uploadedRecordings,
      p_deleted_image_ids: deletedImageIds,
      p_new_images: uploadedImages,
      p_deleted_video_ids: deletedVideoIds,
      p_new_videos: uploadedVideos,
    });

    if (error) {
      throw error;
    }

    // Clean up storage files for deleted media (fire-and-forget)
    if (deletedRecordingPaths.length > 0) {
      supabase.storage.from("notes-voice").remove(deletedRecordingPaths);
    }
    if (deletedImagePaths.length > 0) {
      supabase.storage.from("notes-images").remove(deletedImagePaths);
    }
    if (deletedVideoPaths.length > 0) {
      supabase.storage.from("media-videos").remove(deletedVideoPaths);
    }

    return data;
  } catch (error) {
    // cleanup orphaned uploads
    if (uploadedRecordings.length > 0) {
      await supabase.storage
        .from("notes-voice")
        .remove(uploadedRecordings.map((r) => r.storage_path));
    }
    if (uploadedImages.length > 0) {
      await supabase.storage
        .from("notes-images")
        .remove(uploadedImages.map((r) => r.storage_path));
    }
    if (uploadedVideos.length > 0) {
      const paths = uploadedVideos.flatMap((v) => [
        v.storage_path,
        v.thumbnail_storage_path,
      ]);
      await supabase.storage.from("media-videos").remove(paths);
    }

    handleError(error, {
      message: "Error editing weight",
      route: "/database/weight/edit-weight",
      method: "POST",
    });
    throw new Error("Error editing weight");
  }
}
