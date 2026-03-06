import { useEffect } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { markHabitDone } from "@/database/habits/mark-habit-done";

const DIRTY_KEY = "habit-bg-dirty";
const PENDING_KEY = "habit-pending-done";

async function processPending() {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  if (!raw) return false;

  const pending: { habitId: string; date: string }[] = JSON.parse(raw);
  if (pending.length === 0) return false;

  const failed: { habitId: string; date: string }[] = [];

  for (const entry of pending) {
    try {
      await markHabitDone(entry.habitId, entry.date);
    } catch {
      failed.push(entry);
    }
  }

  if (failed.length > 0) {
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(failed));
  } else {
    await AsyncStorage.removeItem(PENDING_KEY);
  }

  return pending.length > failed.length;
}

async function syncHabits(queryClient: ReturnType<typeof useQueryClient>) {
  const [dirty, synced] = await Promise.all([
    AsyncStorage.getItem(DIRTY_KEY),
    processPending(),
  ]);

  if (dirty === "true" || synced) {
    await AsyncStorage.removeItem(DIRTY_KEY);
    queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
    queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
  }
}

export function HabitBgSyncListener() {
  const queryClient = useQueryClient();

  // Check on mount (app opened from killed state)
  useEffect(() => {
    const timeout = setTimeout(() => syncHabits(queryClient), 2000);
    return () => clearTimeout(timeout);
  }, [queryClient]);

  // Check on app resume (app was in background)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setTimeout(() => syncHabits(queryClient), 500);
      }
    });

    return () => sub.remove();
  }, [queryClient]);

  return null;
}
