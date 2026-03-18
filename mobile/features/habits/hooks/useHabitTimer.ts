import { useCallback, useEffect, useRef } from "react";
import { AppState, DeviceEventEmitter } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useQueryClient } from "@tanstack/react-query";
import {
  scheduleNativeAlarm,
  cancelNativeAlarm,
} from "@/native/android/NativeAlarm";
import { markHabitDone } from "@/database/habits/mark-habit-done";
import { upsertHabitProgress } from "@/database/habits/upsert-habit-progress";
import { useConfirmAction } from "@/lib/confirmAction";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { Habit } from "@/types/habit";
import { router } from "expo-router";

const CONTEXT_KEY = "habit-timer-context";

type HabitTimerContext = {
  habitId: string;
  habitName: string;
  targetSeconds: number;
  accumulatedAtStart: number;
  alarmType: "normal" | "priority";
  date: string;
};

// Shared store for habit timer context (reactive across components)
export const useHabitContextStore = create<{
  context: HabitTimerContext | null;
  setContext: (ctx: HabitTimerContext | null) => void;
}>((set) => ({
  context: null,
  setContext: (ctx) => set({ context: ctx }),
}));

// Load persisted context on module init
AsyncStorage.getItem(CONTEXT_KEY).then((value) => {
  if (value) {
    useHabitContextStore.getState().setContext(JSON.parse(value));
  }
});

async function saveContext(ctx: HabitTimerContext | null) {
  useHabitContextStore.getState().setContext(ctx);
  if (ctx) {
    await AsyncStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
  } else {
    await AsyncStorage.removeItem(CONTEXT_KEY);
  }
}

export function useHabitTimer() {
  const { t } = useTranslation("habits");
  const queryClient = useQueryClient();
  const confirmAction = useConfirmAction();

  const context = useHabitContextStore((s) => s.context);
  const activeSession = useTimerStore((s) => s.activeSession);
  const isRunning = useTimerStore((s) => s.isRunning);
  const paused = useTimerStore((s) => s.paused);

  const isHabitTimer = activeSession?.type === "habit";
  const activeHabitId = isHabitTimer ? context?.habitId ?? null : null;

  const habitTimerState: "idle" | "running" | "paused" = !isHabitTimer
    ? "idle"
    : isRunning
      ? "running"
      : paused
        ? "paused"
        : "idle";

  const startHabitTimer = useCallback(
    async (habit: Habit, accumulatedSeconds: number) => {
      const store = useTimerStore.getState();

      // If this habit's timer is paused, resume it instead of starting fresh
      if (
        store.activeSession?.type === "habit" &&
        store.paused &&
        context?.habitId === habit.id
      ) {
        store.resumeTimer(habit.name);
        // Re-schedule native alarm for the remaining time
        const newEnd = useTimerStore.getState().endTimestamp;
        if (newEnd) {
          const soundType =
            habit.alarm_type === "priority" ? "habit-priority" : "habit";
          scheduleNativeAlarm(
            newEnd,
            "timer",
            habit.name,
            soundType,
            "",
            t("habitTimerDone", { habitName: habit.name }),
            t("durationCompleted"),
          );
        }
        return;
      }

      if (store.activeSession) {
        Toast.show({ type: "error", text1: t("habitTimerActive") });
        return;
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

      await saveContext(ctx);

      store.startTimer(remaining, habit.name);
      store.setActiveSession({
        label: habit.name,
        path: "/timer/empty-timer",
        type: "habit",
      });

      const soundType = habit.alarm_type === "priority" ? "habit-priority" : "habit";
      scheduleNativeAlarm(
        Date.now() + remaining * 1000,
        "timer",
        habit.name,
        soundType,
        "",
        t("habitTimerDone", { habitName: habit.name }),
        t("durationCompleted"),
      );
    },
    [t, context],
  );

  const pauseHabitTimer = useCallback(async () => {
    const store = useTimerStore.getState();
    if (!context) return;

    // Calculate elapsed time and save progress
    cancelNativeAlarm("timer");

    if (store.isRunning && store.endTimestamp) {
      const remaining = Math.max(0, store.endTimestamp - Date.now()) / 1000;
      const remainingAtStart =
        context.targetSeconds - context.accumulatedAtStart;
      const elapsed = Math.max(0, remainingAtStart - remaining);
      const newAccumulated = Math.round(context.accumulatedAtStart + elapsed);
      await upsertHabitProgress(context.habitId, context.date, newAccumulated);
    }

    // Fully clear timer and session
    store.clearEverything();
    await saveContext(null);

    queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
    queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  }, [context, queryClient]);

  const cancelHabitTimer = useCallback(async () => {
    if (!context) return;

    const confirmed = await confirmAction({
      title: t("habitTimerCancelTitle"),
      message: t("habitTimerCancelMessage"),
    });
    if (!confirmed) return;

    const store = useTimerStore.getState();

    if (store.isRunning && store.endTimestamp) {
      const remainingNow = Math.max(0, store.endTimestamp - Date.now()) / 1000;
      const remainingAtStart =
        context.targetSeconds - context.accumulatedAtStart;
      const elapsed = Math.max(0, remainingAtStart - remainingNow);
      const newAccumulated = Math.round(
        context.accumulatedAtStart + elapsed,
      );
      await upsertHabitProgress(context.habitId, context.date, newAccumulated);
    }

    store.clearEverything();
    await saveContext(null);

    queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
    queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  }, [context, confirmAction, t, queryClient]);

  return {
    startHabitTimer,
    pauseHabitTimer,
    cancelHabitTimer,
    activeHabitId,
    habitTimerState,
    context,
  };
}

// Place this component in the layout to handle habit timer side effects
export function HabitTimerListener() {
  const { t } = useTranslation("habits");
  const queryClient = useQueryClient();

  const context = useHabitContextStore((s) => s.context);
  const activeSession = useTimerStore((s) => s.activeSession);
  const isRunning = useTimerStore((s) => s.isRunning);
  const alarmFired = useTimerStore((s) => s.alarmFired);
  const alarmSoundPlaying = useTimerStore((s) => s.alarmSoundPlaying);

  const isHabitTimer = activeSession?.type === "habit";
  const completionHandledRef = useRef(false);

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
    queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  }, [queryClient]);


  // Handle completion
  useEffect(() => {
    if (!alarmFired || !isHabitTimer || !context || completionHandledRef.current)
      return;

    const completeHabit = async () => {
      completionHandledRef.current = true;

      await upsertHabitProgress(
        context.habitId,
        context.date,
        context.targetSeconds,
      );
      await markHabitDone(context.habitId, context.date);

      Toast.show({
        type: "success",
        text1: t("habitTimerDone", { habitName: context.habitName }),
      });
      invalidateQueries();

      setTimeout(async () => {
        router.replace("/dashboard");
        useTimerStore.getState().clearEverything();
        await saveContext(null);
        completionHandledRef.current = false;
      }, 2000);
    };

    if (context.alarmType === "normal") {
      completeHabit();
    } else if (context.alarmType === "priority" && !alarmSoundPlaying) {
      // Priority: complete after user stops the alarm
      completeHabit();
    }
  }, [alarmFired, alarmSoundPlaying, isHabitTimer, context, t, invalidateQueries]);

  // When native alarm is stopped, complete the habit and clear JS timer
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("STOP_ALARM_SOUND", async () => {
      useTimerStore.getState().setAlarmSoundPlaying(false);

      const ctx = useHabitContextStore.getState().context;
      const store = useTimerStore.getState();
      if (!ctx || store.activeSession?.type !== "habit") return;
      if (completionHandledRef.current) return;

      completionHandledRef.current = true;

      await upsertHabitProgress(ctx.habitId, ctx.date, ctx.targetSeconds);
      await markHabitDone(ctx.habitId, ctx.date);

      Toast.show({
        type: "success",
        text1: t("habitTimerDone", { habitName: ctx.habitName }),
      });

      store.clearEverything();
      await saveContext(null);
      invalidateQueries();
      completionHandledRef.current = false;
    });
    return () => sub.remove();
  }, [t, invalidateQueries]);

  // Complete expired habit timer (on mount and when app returns to foreground)
  const completeExpiredHabit = useCallback(async () => {
    const ctx = useHabitContextStore.getState().context;
    if (!ctx) return;
    if (completionHandledRef.current) return;

    const store = useTimerStore.getState();
    if (
      store.endTimestamp &&
      Date.now() >= store.endTimestamp &&
      store.activeSession?.type === "habit"
    ) {
      completionHandledRef.current = true;

      await upsertHabitProgress(ctx.habitId, ctx.date, ctx.targetSeconds);
      await markHabitDone(ctx.habitId, ctx.date);
      store.clearEverything();
      await saveContext(null);
      Toast.show({
        type: "success",
        text1: t("habitTimerDone", { habitName: ctx.habitName }),
      });
      invalidateQueries();
      completionHandledRef.current = false;
    }
  }, [t, invalidateQueries]);

  // On mount: check for expired habit timer
  useEffect(() => {
    const timeout = setTimeout(completeExpiredHabit, 1500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When app returns to foreground: check for expired habit timer
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        completeExpiredHabit();
      }
    });
    return () => sub.remove();
  }, [completeExpiredHabit]);

  return null;
}
