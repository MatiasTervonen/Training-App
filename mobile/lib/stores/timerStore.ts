// How to use useTimerStore to avoid re-rendering on uiTick changes:

// When only need value, dosent show on ui, example saving
//  const { .... } = useTimerStore.getState();

// When using timer and showing on ui, to avoid rerendering every second when uiTick changes, use selectors
//  const activeSession = useTimerStore((state) => state.activeSession);
//  const isRunning = useTimerStore((state) => state.isRunning);
//  .....

// if you want rerender on uiTick changes, use the state directly
//  const { uiTick, ...rest } = useTimerStore.getState();

// store/timerStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  startNativeTimer,
  stopNativeTimer,
} from "@/native/android/NativeTimer";
import {
  cancelNativeAlarm,
  scheduleNativeAlarm,
} from "@/native/android/NativeAlarm";
import { t } from "i18next";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
  started_at: number;
  gpsAllowed?: boolean;
  stepsAllowed?: boolean;
  hasTemplateRoute?: boolean;
};

type SessionMode = "countup" | "countdown";

interface TimerState {
  activeSession: ActiveSession | null;
  isRunning: boolean;
  alarmFired: boolean;
  startTimestamp: number | null;
  endTimestamp: number | null;
  remainingMs: number | null;
  mode: SessionMode | null;
  uiTick: number;
  totalDuration: number;
  alarmSoundPlaying: boolean;
  paused: boolean;
  setActiveSession: (session: NewSession) => void;
  startTimer: (totalDuration: number, label: string) => void;
  pauseTimer: () => void;
  clearEverything: () => void;
  resumeTimer: (label: string) => void;
  setAlarmFired: (fired: boolean) => void;
  startSession: (label: string) => void;
  setAlarmSoundPlaying: (playing: boolean) => void;
}

let interval: ReturnType<typeof setInterval> | null = null;

type NewSession = Omit<ActiveSession, "started_at">;

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      isRunning: false,
      alarmFired: false,
      startTimestamp: null,
      endTimestamp: null,
      remainingMs: null,
      mode: null,
      uiTick: 0,
      totalDuration: 0,
      alarmSoundPlaying: false,
      elapsedTime: 0,
      paused: false,
      setActiveSession: (session: NewSession) =>
        set({
          activeSession: {
            started_at: Date.now(),
            ...session,
          } as ActiveSession,
        }),

      startSession: (label: string) => {
        if (interval) clearInterval(interval);

        const now = Date.now();

        set({
          isRunning: true,
          mode: "countup",
          startTimestamp: now,
          endTimestamp: null,
          remainingMs: null,
          alarmFired: false,
        });

        startNativeTimer(now, label, "countup", t("timer:timer.notification.inProgress"));

        interval = setInterval(() => {
          set((state) => ({
            uiTick: state.uiTick + 1,
          }));
        }, 1000);
      },

      startTimer: (totalDurationInSeconds, label) => {
        if (interval) clearInterval(interval);

        const now = Date.now();

        const endTimestamp = now + totalDurationInSeconds * 1000;

        set({
          isRunning: true,
          alarmFired: false,
          startTimestamp: now,
          endTimestamp,
          mode: "countdown",
          totalDuration: totalDurationInSeconds,
        });

        startNativeTimer(endTimestamp, label, "countdown", t("timer:timer.notification.timeRemaining"));

        interval = setInterval(() => {
          const { isRunning, mode, endTimestamp } = get();

          if (!isRunning) return;

          if (
            mode === "countdown" &&
            endTimestamp &&
            Date.now() >= endTimestamp
          ) {
            set({
              alarmFired: true,
              isRunning: false,
              alarmSoundPlaying: true,
            });
            stopNativeTimer();

            return;
          }

          set((state) => ({ uiTick: state.uiTick + 1 }));
        }, 1000);
      },

      clearEverything: () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        stopNativeTimer();

        set({
          isRunning: false,
          alarmFired: false,
          activeSession: null,
          startTimestamp: null,
          endTimestamp: null,
          remainingMs: null,
          alarmSoundPlaying: false,
          paused: false,
        });
      },

      pauseTimer: () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        stopNativeTimer();

        if (get().activeSession?.type === "timer") {
          cancelNativeAlarm("timer");
        }

        const { isRunning, endTimestamp, mode, startTimestamp } = get();
        if (!startTimestamp || !isRunning) return;

        const now = Date.now();

        const frozeMS =
          mode === "countup"
            ? now - startTimestamp
            : Math.max(0, endTimestamp! - now);

        set({
          isRunning: false,
          startTimestamp: null,
          endTimestamp: null,
          remainingMs: frozeMS,
          paused: true,
        });
      },

      resumeTimer: (label: string) => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        const { remainingMs, mode } = get();
        if (!remainingMs) return;

        const now = Date.now();

        if (mode === "countup") {
          set({
            isRunning: true,
            startTimestamp: now - remainingMs,
            remainingMs: null,
          });
        } else {
          set({
            isRunning: true,
            endTimestamp: now + remainingMs,
            startTimestamp: now,
            remainingMs: null,
            paused: false,
          });
        }

        if (mode === "countup") {
          startNativeTimer(now - remainingMs, label, "countup", t("timer:timer.notification.inProgress"));
        } else {
          startNativeTimer(now + remainingMs, label, "countdown", t("timer:timer.notification.timeRemaining"));
        }

        if (get().activeSession?.type === "timer") {
          scheduleNativeAlarm(
            now + remainingMs,
            "timer",
            t("timer:timer.title"),
            "timer",
            "",
            t("timer:timer.notification.tapToOpenTimer"),
            t("timer:timer.notification.timesUp"),
            t("timer:timer.notification.stopAlarm")
          );
        }

        interval = setInterval(() => {
          const { isRunning, mode, endTimestamp } = get();

          if (!isRunning) return;

          if (
            mode === "countdown" &&
            endTimestamp &&
            Date.now() >= endTimestamp
          ) {
            set({
              alarmFired: true,
              isRunning: false,
              alarmSoundPlaying: true,
            });
            stopNativeTimer();

            return;
          }

          set((state) => ({ uiTick: state.uiTick + 1 }));
        }, 1000);
      },

      setAlarmSoundPlaying: (playing) => set({ alarmSoundPlaying: playing }),
      setAlarmFired: (fired) => set({ alarmFired: fired }),
    }),
    {
      name: "timer-store",
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
    }
  )
);
