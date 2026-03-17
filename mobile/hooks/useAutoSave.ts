import { useState, useRef, useEffect, useCallback } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

type UseAutoSaveOptions<T> = {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
};

type UseAutoSaveReturn = {
  status: AutoSaveStatus;
  hasPendingChanges: boolean;
};

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 1500,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const baselineRef = useRef<string>(JSON.stringify(data));
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef<T | null>(null);
  const latestDataRef = useRef(data);
  const onSaveRef = useRef(onSave);
  const mountedRef = useRef(true);
  const prevEnabledRef = useRef(enabled);

  latestDataRef.current = data;
  onSaveRef.current = onSave;

  // Reset baseline when enabled transitions false → true (during render)
  // so isDirty is computed correctly below
  const dataStr = JSON.stringify(data);
  if (enabled && !prevEnabledRef.current) {
    baselineRef.current = dataStr;
  }
  prevEnabledRef.current = enabled;

  const isDirty = dataStr !== baselineRef.current;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const performSave = useCallback(async (saveData: T) => {
    if (isSavingRef.current) {
      pendingSaveRef.current = saveData;
      return;
    }

    isSavingRef.current = true;
    if (mountedRef.current) setStatus("saving");

    try {
      await onSaveRef.current(saveData);
      if (!mountedRef.current) return;

      baselineRef.current = JSON.stringify(saveData);
      setStatus("saved");

      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setStatus("idle");
      }, 1500);
    } catch {
      if (mountedRef.current) setStatus("error");
    } finally {
      isSavingRef.current = false;

      // Process queued save
      if (pendingSaveRef.current) {
        const pending = pendingSaveRef.current;
        pendingSaveRef.current = null;
        if (JSON.stringify(pending) !== baselineRef.current) {
          performSave(pending);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || !isDirty) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      performSave(latestDataRef.current);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [dataStr, enabled, isDirty, debounceMs, performSave]);

  // Keep baseline in sync when data changes from external sources (e.g. refetch)
  // and there are no pending user changes
  useEffect(() => {
    if (!isDirty && status === "idle") {
      baselineRef.current = dataStr;
    }
  }, [dataStr, isDirty, status]);

  return {
    status,
    hasPendingChanges: isDirty || status === "saving",
  };
}
