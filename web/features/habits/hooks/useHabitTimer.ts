"use client";

import { useCallback, useRef } from "react";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useQueryClient } from "@tanstack/react-query";
import { upsertHabitProgress } from "@/database/habits/upsert-habit-progress";
import { useTranslation } from "react-i18next";
import { Habit } from "@/types/habit";
import toast from "react-hot-toast";

const CONTEXT_KEY = "habit-timer-context";

type HabitTimerContext = {
  habitId: string;
  habitName: string;
  targetSeconds: number;
  accumulatedAtStart: number;
  alarmType: "normal" | "priority";
  date: string;
};

function loadContext(): HabitTimerContext | null {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveContextToStorage(ctx: HabitTimerContext | null) {
  if (ctx) {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
  } else {
    localStorage.removeItem(CONTEXT_KEY);
  }
}

export function useHabitTimer() {
  const { t } = useTranslation("habits");
  const queryClient = useQueryClient();

  const activeSession = useTimerStore((s) => s.activeSession);
  const isRunning = useTimerStore((s) => s.isRunning);
  const paused = useTimerStore((s) => s.paused);
  const elapsedTime = useTimerStore((s) => s.elapsedTime);
  const totalDuration = useTimerStore((s) => s.totalDuration);

  const contextRef = useRef<HabitTimerContext | null>(loadContext());

  const isHabitTimer = activeSession?.type === "habit";
  const context = contextRef.current;
  const activeHabitId = isHabitTimer ? context?.habitId ?? null : null;

  const habitTimerState: "idle" | "running" | "paused" = !isHabitTimer
    ? "idle"
    : isRunning
      ? "running"
      : paused
        ? "paused"
        : "idle";

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
    queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  }, [queryClient]);

  const startHabitTimer = useCallback(
    (habit: Habit, accumulatedSeconds: number) => {
      const store = useTimerStore.getState();

      // If this habit's timer is paused, resume
      if (
        store.activeSession?.type === "habit" &&
        store.paused &&
        contextRef.current?.habitId === habit.id
      ) {
        store.resumeTimer();
        return;
      }

      if (store.activeSession) {
        toast.error(t("habits.habitTimerActive"));
        return;
      }

      // Request notification permission when starting a timer
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
      }

      const targetSeconds = habit.target_value!;
      const remaining = targetSeconds - accumulatedSeconds;
      if (remaining <= 0) return;

      const today = new Date().toLocaleDateString("en-CA");
      const ctx: HabitTimerContext = {
        habitId: habit.id,
        habitName: habit.name,
        targetSeconds,
        accumulatedAtStart: accumulatedSeconds,
        alarmType: habit.alarm_type,
        date: today,
      };

      contextRef.current = ctx;
      saveContextToStorage(ctx);

      store.setActiveSession({
        label: habit.name,
        path: "/timer/empty-timer",
        type: "habit",
      });
      store.startTimer(remaining);
    },
    [t],
  );

  const pauseHabitTimer = useCallback(async () => {
    const store = useTimerStore.getState();
    const ctx = contextRef.current;
    if (!ctx) return;

    const elapsed = store.elapsedTime;
    const newAccumulated = Math.round(ctx.accumulatedAtStart + elapsed);
    await upsertHabitProgress(ctx.habitId, ctx.date, newAccumulated);

    store.pauseTimer();
    invalidateQueries();
  }, [invalidateQueries]);

  const cancelHabitTimer = useCallback(async () => {
    const ctx = contextRef.current;
    if (!ctx) return;

    const confirmed = window.confirm(
      `${t("habits.habitTimerCancelTitle")}\n${t("habits.habitTimerCancelMessage")}`,
    );
    if (!confirmed) return;

    const store = useTimerStore.getState();
    const elapsed = store.elapsedTime;
    const newAccumulated = Math.round(ctx.accumulatedAtStart + elapsed);
    await upsertHabitProgress(ctx.habitId, ctx.date, newAccumulated);

    store.clearEverything();
    contextRef.current = null;
    saveContextToStorage(null);
    invalidateQueries();
  }, [t, invalidateQueries]);

  return {
    startHabitTimer,
    pauseHabitTimer,
    cancelHabitTimer,
    activeHabitId,
    habitTimerState,
    context,
    elapsedTime,
    totalDuration,
  };
}
