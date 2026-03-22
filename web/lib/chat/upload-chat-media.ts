import { createClient } from "@/utils/supabase/client";

const SIGNED_URL_EXPIRY = 3600; // 1 hour

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export async function uploadChatMedia(
  file: File,
  storagePath: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("chat-media")
    .upload(storagePath, file);
  if (error) throw error;
}

export async function getChatMediaSignedUrl(
  storagePath: string
): Promise<string> {
  const cached = signedUrlCache.get(storagePath);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("chat-media")
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);
  if (error || !data?.signedUrl) throw error ?? new Error("Failed to create signed URL");

  signedUrlCache.set(storagePath, {
    url: data.signedUrl,
    expiresAt: Date.now() + (SIGNED_URL_EXPIRY - 60) * 1000, // refresh 1 min early
  });

  return data.signedUrl;
}

export function clearSignedUrlCache(storagePath: string): void {
  signedUrlCache.delete(storagePath);
}

export async function deleteChatMedia(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createClient();
  await supabase.storage.from("chat-media").remove(paths);
  for (const p of paths) signedUrlCache.delete(p);
}

export async function compressImage(file: File, maxSize = 2048): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width <= maxSize && height <= maxSize) {
        resolve(file);
        return;
      }

      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          if (blob.size > 10 * 1024 * 1024) {
            reject(new Error("Image too large after compression"));
            return;
          }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.7
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function generateVideoThumbnail(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src);
          if (!blob) {
            reject(new Error("Thumbnail generation failed"));
            return;
          }
          resolve(new File([blob], "thumb.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.7
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video"));
    };

    video.src = URL.createObjectURL(file);
  });
}

export function getVideoDurationMs(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const ms = Math.round(video.duration * 1000);
      URL.revokeObjectURL(video.src);
      resolve(ms);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video metadata"));
    };
    video.src = URL.createObjectURL(file);
  });
}

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
