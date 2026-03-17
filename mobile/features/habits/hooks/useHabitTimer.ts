import { useCallback, useEffect, useRef } from "react";
import { DeviceEventEmitter } from "react-native";
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

      const soundType = habit.alarm_type === "priority" ? "timer" : "habit";
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
    [t],
  );

  const pauseHabitTimer = useCallback(() => {
    useTimerStore.getState().pauseTimer();
    // Side effects (save progress, cancel alarm) handled by HabitTimerListener
  }, []);

  const resumeHabitTimer = useCallback(() => {
    const store = useTimerStore.getState();
    const label = store.activeSession?.label ?? "";
    store.resumeTimer(label);
    // Side effects (alarm scheduling) handled by HabitTimerListener
  }, []);

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
    resumeHabitTimer,
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
  const paused = useTimerStore((s) => s.paused);
  const remainingMs = useTimerStore((s) => s.remainingMs);

  const isHabitTimer = activeSession?.type === "habit";
  const completionHandledRef = useRef(false);
  const prevIsRunningRef = useRef(isRunning);
  const prevPausedRef = useRef(paused);

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
    queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  }, [queryClient]);

  // Detect pause/resume transitions
  useEffect(() => {
    const wasRunning = prevIsRunningRef.current;
    const wasPaused = prevPausedRef.current;
    prevIsRunningRef.current = isRunning;
    prevPausedRef.current = paused;

    if (!isHabitTimer || !context) return;

    // Pause detected: was running → now paused
    if (wasRunning && !isRunning && paused) {
      cancelNativeAlarm("timer");

      const remaining = (remainingMs ?? 0) / 1000;
      const remainingAtStart =
        context.targetSeconds - context.accumulatedAtStart;
      const elapsed = Math.max(0, remainingAtStart - remaining);
      const newAccumulated = Math.round(
        context.accumulatedAtStart + elapsed,
      );

      upsertHabitProgress(context.habitId, context.date, newAccumulated);

      const updatedCtx = { ...context, accumulatedAtStart: newAccumulated };
      saveContext(updatedCtx);
      invalidateQueries();
    }

    // Resume detected: was paused → now running
    if (isRunning && !wasRunning && wasPaused) {
      const store = useTimerStore.getState();
      if (store.endTimestamp) {
        const soundType =
          context.alarmType === "priority" ? "timer" : "habit";
        scheduleNativeAlarm(
          store.endTimestamp,
          "timer",
          context.habitName,
          soundType,
          "",
          t("habitTimerDone", { habitName: context.habitName }),
          t("durationCompleted"),
        );
      }
    }
  }, [isRunning, paused, isHabitTimer, context, remainingMs, invalidateQueries, t]);

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

  // Ensure STOP_ALARM_SOUND sets alarmSoundPlaying=false even when not on timer screen
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("STOP_ALARM_SOUND", () => {
      useTimerStore.getState().setAlarmSoundPlaying(false);
    });
    return () => sub.remove();
  }, []);

  // Crash recovery: handle timer that ended while app was killed
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const ctx = useHabitContextStore.getState().context;
      if (!ctx) return;

      const store = useTimerStore.getState();
      if (
        store.endTimestamp &&
        Date.now() >= store.endTimestamp &&
        !store.alarmFired &&
        store.activeSession?.type === "habit"
      ) {
        await upsertHabitProgress(ctx.habitId, ctx.date, ctx.targetSeconds);
        await markHabitDone(ctx.habitId, ctx.date);
        store.clearEverything();
        await saveContext(null);
        Toast.show({
          type: "success",
          text1: t("habitTimerDone", { habitName: ctx.habitName }),
        });
        invalidateQueries();
      }
    }, 1500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
