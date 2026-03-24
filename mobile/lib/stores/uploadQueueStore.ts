import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { uploadFileToStorage, getAccessToken } from "@/lib/upload-with-progress";
import * as FileSystem from "expo-file-system/legacy";
import { onlineManager } from "@tanstack/react-query";

type MediaType = "image" | "video" | "recording";
export type TargetType = "session" | "note" | "weight";

type QueueItemStatus =
  | "pending"
  | "uploading"
  | "attaching"
  | "completed"
  | "failed";

export type QueueItem = {
  id: string;
  targetId: string;
  targetType: TargetType;
  mediaType: MediaType;
  status: QueueItemStatus;

  // File info
  localUri: string;
  storagePath: string;
  bucket: string;
  contentType: string;

  // Video-specific
  thumbnailUri?: string;
  thumbnailStoragePath?: string;

  // Metadata
  durationMs?: number;

  // Progress & retry
  progress: number;
  retryCount: number;
  error?: string;

  createdAt: number;
};

export type TargetProgress = {
  total: number;
  completed: number;
  failed: number;
  uploading: boolean;
  progress: number;
};

interface UploadQueueState {
  queue: QueueItem[];
  isProcessing: boolean;

  enqueue: (items: QueueItem[]) => void;
  processNext: () => Promise<void>;
  retryFailed: (targetId: string) => void;
  clearCompleted: (targetId: string) => void;
  removeTarget: (targetId: string) => void;
}

const MAX_RETRIES = 3;

const RPC_MAP: Record<TargetType, { rpcName: string; idParam: string }> = {
  session: { rpcName: "attach_session_media", idParam: "p_session_id" },
  note: { rpcName: "attach_note_media", idParam: "p_note_id" },
  weight: { rpcName: "attach_weight_media", idParam: "p_weight_id" },
};

function buildRpcPayload(item: QueueItem) {
  const { rpcName, idParam } = RPC_MAP[item.targetType];

  const payload: Record<string, unknown> = {
    [idParam]: item.targetId,
  };

  if (item.mediaType === "image") {
    payload.p_images = [{ storage_path: item.storagePath }];
  } else if (item.mediaType === "video") {
    payload.p_videos = [
      {
        storage_path: item.storagePath,
        thumbnail_storage_path: item.thumbnailStoragePath,
        duration_ms: item.durationMs ?? 0,
      },
    ];
  } else if (item.mediaType === "recording") {
    payload.p_recordings = [
      {
        storage_path: item.storagePath,
        duration_ms: item.durationMs,
      },
    ];
  }

  return { rpcName, payload };
}

export const useUploadQueueStore = create<UploadQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isProcessing: false,

      enqueue: (items) => {
        set((state) => ({
          queue: [...state.queue, ...items],
        }));
      },

      processNext: async () => {
        const { queue, isProcessing } = get();
        if (isProcessing) return;

        const next = queue.find((item) => item.status === "pending");
        if (!next) return;

        // Check network
        if (!onlineManager.isOnline()) return;

        set({ isProcessing: true });

        // Update item to uploading
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === next.id ? { ...item, status: "uploading" as const, progress: 0 } : item,
          ),
        }));

        try {
          // Validate file exists
          const fileInfo = await FileSystem.getInfoAsync(next.localUri);
          if (!fileInfo.exists) {
            throw new Error("file_not_found");
          }

          // Get fresh access token
          const accessToken = await getAccessToken();

          // Upload main file (409 Duplicate = already uploaded on a previous attempt)
          try {
            await uploadFileToStorage(
              next.bucket,
              next.storagePath,
              next.localUri,
              next.contentType,
              accessToken,
              (loaded, total) => {
                const fileProgress = total > 0 ? loaded / total : 0;
                const adjustedProgress = next.thumbnailUri
                  ? fileProgress * 0.9
                  : fileProgress;

                set((state) => ({
                  queue: state.queue.map((item) =>
                    item.id === next.id
                      ? { ...item, progress: adjustedProgress }
                      : item,
                  ),
                }));
              },
            );
          } catch (uploadErr) {
            const isDuplicate = uploadErr instanceof Error && uploadErr.message.includes("409");
            if (!isDuplicate) throw uploadErr;
          }

          // Upload thumbnail if video
          if (next.thumbnailUri && next.thumbnailStoragePath) {
            const thumbInfo = await FileSystem.getInfoAsync(next.thumbnailUri);
            if (!thumbInfo.exists) {
              throw new Error("thumbnail_not_found");
            }

            try {
              await uploadFileToStorage(
                next.bucket,
                next.thumbnailStoragePath,
                next.thumbnailUri,
                "image/jpeg",
                accessToken,
                (loaded, total) => {
                  const thumbProgress = total > 0 ? loaded / total : 0;
                  set((state) => ({
                    queue: state.queue.map((item) =>
                      item.id === next.id
                        ? { ...item, progress: 0.9 + thumbProgress * 0.1 }
                        : item,
                    ),
                  }));
                },
              );
            } catch (thumbErr) {
              const isDuplicate = thumbErr instanceof Error && thumbErr.message.includes("409");
              if (!isDuplicate) throw thumbErr;
            }
          }

          // Attach media via RPC
          set((state) => ({
            queue: state.queue.map((item) =>
              item.id === next.id
                ? { ...item, status: "attaching" as const, progress: 1 }
                : item,
            ),
          }));

          const { rpcName, payload } = buildRpcPayload(next);
          const { error } = await supabase.rpc(rpcName, payload);
          if (error) {
            throw error;
          }

          // Mark completed
          set((state) => ({
            queue: state.queue.map((item) =>
              item.id === next.id
                ? { ...item, status: "completed" as const, progress: 1 }
                : item,
            ),
            isProcessing: false,
          }));

          // Clean up local files
          FileSystem.deleteAsync(next.localUri, { idempotent: true }).catch(
            () => {},
          );
          if (next.thumbnailUri) {
            FileSystem.deleteAsync(next.thumbnailUri, {
              idempotent: true,
            }).catch(() => {});
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Upload failed";
          const currentItem = get().queue.find((i) => i.id === next.id);
          const newRetryCount = (currentItem?.retryCount ?? 0) + 1;

          set((state) => ({
            queue: state.queue.map((item) =>
              item.id === next.id
                ? {
                    ...item,
                    status:
                      newRetryCount >= MAX_RETRIES || errorMessage === "file_not_found"
                        ? ("failed" as const)
                        : ("pending" as const),
                    retryCount: newRetryCount,
                    error: errorMessage,
                    progress: 0,
                  }
                : item,
            ),
            isProcessing: false,
          }));
        }

        // Process next item in queue
        set({ isProcessing: false });
        const store = get();
        if (store.queue.some((item) => item.status === "pending")) {
          setTimeout(() => {
            useUploadQueueStore.getState().processNext();
          }, 100);
        }
      },

      retryFailed: (targetId) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.targetId === targetId && item.status === "failed"
              ? { ...item, status: "pending" as const, retryCount: 0, error: undefined }
              : item,
          ),
        }));
        get().processNext();
      },

      clearCompleted: (targetId) => {
        set((state) => ({
          queue: state.queue.filter(
            (item) =>
              !(item.targetId === targetId && item.status === "completed"),
          ),
        }));
      },

      removeTarget: (targetId) => {
        const items = get().queue.filter(
          (item) => item.targetId === targetId,
        );
        // Clean up local files
        for (const item of items) {
          FileSystem.deleteAsync(item.localUri, { idempotent: true }).catch(
            () => {},
          );
          if (item.thumbnailUri) {
            FileSystem.deleteAsync(item.thumbnailUri, {
              idempotent: true,
            }).catch(() => {});
          }
        }
        set((state) => ({
          queue: state.queue.filter((item) => item.targetId !== targetId),
        }));
      },
    }),
    {
      name: "upload-queue-store",
      storage: {
        getItem: async (key) => {
          const value = await AsyncStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (key, value) => {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: async (key) => {
          await AsyncStorage.removeItem(key);
        },
      },
      partialize: (state) => ({
        queue: state.queue,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        const hasInterrupted = state.queue.some(
          (item) => item.status === "uploading" || item.status === "attaching",
        );

        if (hasInterrupted) {
          useUploadQueueStore.setState((s) => ({
            queue: s.queue.map((item) =>
              item.status === "uploading" || item.status === "attaching"
                ? { ...item, status: "pending" as const, progress: 0 }
                : item,
            ),
          }));
        }

        if (
          state.queue.some(
            (item) =>
              item.status === "pending" ||
              item.status === "uploading" ||
              item.status === "attaching",
          )
        ) {
          setTimeout(() => {
            useUploadQueueStore.getState().processNext();
          }, 2000);
        }
      },
    },
  ),
);
