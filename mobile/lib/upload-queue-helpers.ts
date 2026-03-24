import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";
import { useUploadQueueStore, QueueItem, TargetType } from "@/lib/stores/uploadQueueStore";

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

const QUEUE_DIR = `${FileSystem.documentDirectory}upload-queue/`;

/** Ensure the upload-queue directory exists */
async function ensureQueueDir() {
  const info = await FileSystem.getInfoAsync(QUEUE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(QUEUE_DIR, { intermediates: true });
  }
}

/** Copy a file to the persistent upload-queue directory */
async function copyToQueueDir(uri: string, ext: string): Promise<string> {
  await ensureQueueDir();
  const destUri = `${QUEUE_DIR}${Crypto.randomUUID()}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: destUri });
  return destUri;
}

/**
 * Prepares draft media files for background upload by copying them to
 * a persistent directory and enqueuing them in the upload queue store.
 */
export async function prepareAndEnqueueMedia({
  targetId,
  targetType,
  draftImages = [],
  draftRecordings = [],
  draftVideos = [],
  userId,
}: {
  targetId: string;
  targetType: TargetType;
  draftImages?: DraftImage[];
  draftRecordings?: DraftRecording[];
  draftVideos?: DraftVideo[];
  userId: string;
}): Promise<void> {
  const items: QueueItem[] = [];

  // Prepare recordings
  for (const recording of draftRecordings) {
    const localUri = await copyToQueueDir(recording.uri, "m4a");
    items.push({
      id: Crypto.randomUUID(),
      targetId,
      targetType,
      mediaType: "recording",
      status: "pending",
      localUri,
      storagePath: `${userId}/${Crypto.randomUUID()}.m4a`,
      bucket: "notes-voice",
      contentType: "audio/m4a",
      durationMs: recording.durationMs,
      progress: 0,
      retryCount: 0,
      createdAt: Date.now(),
    });
  }

  // Prepare images
  for (const image of draftImages) {
    const ext = image.uri.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
    const localUri = await copyToQueueDir(image.uri, ext);
    items.push({
      id: Crypto.randomUUID(),
      targetId,
      targetType,
      mediaType: "image",
      status: "pending",
      localUri,
      storagePath: `${userId}/${Crypto.randomUUID()}.${ext}`,
      bucket: "notes-images",
      contentType: mimeType,
      progress: 0,
      retryCount: 0,
      createdAt: Date.now(),
    });
  }

  // Prepare videos (video file + thumbnail)
  for (const video of draftVideos) {
    const videoLocalUri = await copyToQueueDir(video.uri, "mp4");
    const thumbLocalUri = await copyToQueueDir(video.thumbnailUri, "jpg");
    items.push({
      id: Crypto.randomUUID(),
      targetId,
      targetType,
      mediaType: "video",
      status: "pending",
      localUri: videoLocalUri,
      storagePath: `${userId}/${Crypto.randomUUID()}.mp4`,
      bucket: "media-videos",
      contentType: "video/mp4",
      thumbnailUri: thumbLocalUri,
      thumbnailStoragePath: `${userId}/${Crypto.randomUUID()}-thumb.jpg`,
      durationMs: video.durationMs,
      progress: 0,
      retryCount: 0,
      createdAt: Date.now(),
    });
  }

  if (items.length === 0) return;

  useUploadQueueStore.getState().enqueue(items);
  useUploadQueueStore.getState().processNext();
}
