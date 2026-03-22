"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useQueryClient } from "@tanstack/react-query";
import { markHabitDone } from "@/database/habits/mark-habit-done";
import { upsertHabitProgress } from "@/database/habits/upsert-habit-progress";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { playHabitCompleteSound } from "@/features/habits/lib/habitCompleteSound";
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

function clearContext() {
  localStorage.removeItem(CONTEXT_KEY);
}

export default function HabitTimerListener() {
  const { t } = useTranslation("habits");
  const queryClient = useQueryClient();
  const router = useRouter();

  const activeSession = useTimerStore((s) => s.activeSession);
  const alarmFired = useTimerStore((s) => s.alarmFired);

  const isHabitTimer = activeSession?.type === "habit";
  const completionHandledRef = useRef(false);

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
    queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  }, [queryClient]);

  // Handle timer completion
  useEffect(() => {
    const ctx = loadContext();
    if (!alarmFired || !isHabitTimer || !ctx || completionHandledRef.current) return;

    const completeHabit = async () => {
      completionHandledRef.current = true;

      await upsertHabitProgress(ctx.habitId, ctx.date, ctx.targetSeconds);
      await markHabitDone(ctx.habitId, ctx.date);

      playHabitCompleteSound();

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(t("habits.habitTimerDone", { habitName: ctx.habitName }), {
          body: t("habits.durationCompleted"),
        });
      }

      toast.success(t("habits.habitTimerDone", { habitName: ctx.habitName }));
      invalidateQueries();

      setTimeout(() => {
        useTimerStore.getState().clearEverything();
        clearContext();
        completionHandledRef.current = false;
        router.push("/habits");
      }, 3000);
    };

    completeHabit();
  }, [alarmFired, isHabitTimer, t, invalidateQueries, router]);

  // Check for expired timer on mount
  useEffect(() => {
    const ctx = loadContext();
    if (!ctx) return;

    const store = useTimerStore.getState();
    if (
      store.startTimestamp &&
      store.totalDuration > 0 &&
      store.activeSession?.type === "habit"
    ) {
      const elapsed = Math.floor((Date.now() - store.startTimestamp) / 1000);
      if (elapsed >= store.totalDuration && !completionHandledRef.current) {
        completionHandledRef.current = true;

        upsertHabitProgress(ctx.habitId, ctx.date, ctx.targetSeconds)
          .then(() => markHabitDone(ctx.habitId, ctx.date))
          .then(() => {
            playHabitCompleteSound();
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification(t("habits.habitTimerDone", { habitName: ctx.habitName }), {
                body: t("habits.durationCompleted"),
              });
            }
            toast.success(t("habits.habitTimerDone", { habitName: ctx.habitName }));
            setTimeout(() => {
              store.clearEverything();
              clearContext();
              invalidateQueries();
              completionHandledRef.current = false;
              router.push("/habits");
            }, 3000);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
