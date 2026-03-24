import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import type { AppStateStatus } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadQueueStore, TargetType } from "@/lib/stores/uploadQueueStore";

/** Query keys to invalidate per target type when all uploads complete */
function getInvalidationKeys(targetType: TargetType, targetId: string) {
  const keys: (string | string[])[][] = [
    [["feed"]],
    [["social-feed"]],
  ];

  if (targetType === "session") {
    keys.push(
      [["fullGymSession", targetId]],
      [["fullActivitySession", targetId]],
      [["myGymSessions"]],
    );
  } else if (targetType === "note") {
    keys.push(
      [["fullNote", targetId]],
      [["myNotes"]],
    );
  } else if (targetType === "weight") {
    keys.push(
      [["fullWeight", targetId]],
      [["get-weight"]],
    );
  }

  return keys;
}

/**
 * Null-rendering listener that:
 * 1. Resumes upload queue processing when app returns to foreground
 * 2. Invalidates queries when all uploads for a target complete
 */
export default function UploadQueueListener() {
  const queryClient = useQueryClient();
  const prevQueueRef = useRef(useUploadQueueStore.getState().queue);

  // Resume processing when app comes to foreground
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === "active") {
        const store = useUploadQueueStore.getState();
        if (
          !store.isProcessing &&
          store.queue.some((i) => i.status === "pending")
        ) {
          store.processNext();
        }
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, []);

  // Watch for target completions and invalidate queries
  useEffect(() => {
    const unsub = useUploadQueueStore.subscribe((state) => {
      const prevQueue = prevQueueRef.current;
      prevQueueRef.current = state.queue;

      const targetIds = new Set(state.queue.map((i) => i.targetId));

      for (const targetId of targetIds) {
        const currentItems = state.queue.filter(
          (i) => i.targetId === targetId,
        );
        const prevItems = prevQueue.filter((i) => i.targetId === targetId);

        // All items are finished (completed or failed — nothing pending/uploading)
        const allDone = currentItems.every(
          (i) => i.status === "completed" || i.status === "failed",
        );
        const wasNotAllDone = prevItems.some(
          (i) => i.status !== "completed" && i.status !== "failed",
        );

        if (allDone && wasNotAllDone && currentItems.length > 0) {
          const targetType = currentItems[0].targetType;
          const keys = getInvalidationKeys(targetType, targetId);

          for (const queryKey of keys) {
            queryClient.invalidateQueries({ queryKey: queryKey[0] });
          }

          useUploadQueueStore.getState().clearCompleted(targetId);
        }
      }
    });

    return unsub;
  }, [queryClient]);

  return null;
}
