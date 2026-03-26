import { useEffect, useRef, useCallback } from "react";
import { AppState, Platform } from "react-native";
import { getTodaySteps } from "@/native/android/NativeStepCounter";
import { markHabitDone } from "@/database/habits/mark-habit-done";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useHabitLogs } from "@/features/habits/hooks/useHabitLogs";
import { isHabitScheduledForDate } from "@/features/habits/utils/isHabitScheduled";
import { useQueryClient } from "@tanstack/react-query";
import { HabitLog } from "@/types/habit";
import { getTrackingDate } from "@/lib/formatDate";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function StepHabitAutoCompleteListener() {
  useStepHabitAutoComplete();
  return null;
}

export function useStepHabitAutoComplete() {
  const today = getTrackingDate();
  const { data: habits = [] } = useHabits();
  const { data: logs = [] } = useHabitLogs({ startDate: today, endDate: today });
  const queryClient = useQueryClient();
  const completedRef = useRef<Set<string>>(new Set());
  const logsRef = useRef<HabitLog[]>(logs);
  logsRef.current = logs;

  const stepHabits = habits.filter(
    (h) => h.type === "steps" && h.target_value && isHabitScheduledForDate(h, today),
  );

  const checkAndComplete = useCallback(async () => {
    if (Platform.OS !== "android") return;

    const currentSteps = await getTodaySteps();
    const completedSet = new Set(
      logsRef.current.filter((l) => l.completed_date === today).map((l) => l.habit_id),
    );

    for (const habit of stepHabits) {
      if (completedSet.has(habit.id)) continue;
      if (completedRef.current.has(habit.id)) continue;
      if (currentSteps >= habit.target_value!) {
        completedRef.current.add(habit.id);
        await markHabitDone(habit.id, today);
        queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
        queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
        queryClient.invalidateQueries({ queryKey: ["feed"] });
      }
    }
  }, [stepHabits, today, queryClient]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (stepHabits.length === 0) return;

    // Check immediately on mount (catches up after app was backgrounded/killed)
    checkAndComplete();

    // Poll every 30 seconds while app is open
    const interval = setInterval(checkAndComplete, POLL_INTERVAL_MS);

    // Also check when app returns to foreground
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkAndComplete();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [checkAndComplete, stepHabits.length]);
}
