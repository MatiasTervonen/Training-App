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
import { DeviceEventEmitter } from "react-native";
import {
  startNativeTimer,
  stopNativeTimer,
  pauseNativeTimer,
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
  startTimer: (totalDuration: number, label: string, options?: { skipExtend?: boolean }) => void;
  pauseTimer: () => void;
  clearEverything: () => void;
  clearTimerMechanics: () => void;
  clearUIState: () => void;
  resumeTimer: (label: string) => void;
  setAlarmFired: (fired: boolean) => void;
  startSession: (label: string) => void;
  snoozedTimer: (endTimestamp: number, durationSeconds: number) => void;
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

        startNativeTimer(now, label, "countup", t("timer:timer.notification.inProgress"), t("timer:timer.notification.pauseTimer"));

        interval = setInterval(() => {
          set((state) => ({
            uiTick: state.uiTick + 1,
          }));
        }, 1000);
      },

      startTimer: (totalDurationInSeconds, label, options) => {
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

        startNativeTimer(endTimestamp, label, "countdown", t("timer:timer.notification.timeRemaining"), t("timer:timer.notification.pauseTimer"), options?.skipExtend ? "" : t("timer:timer.notification.extendTimer"));

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
        cancelNativeAlarm("timer");

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

      // Stops interval, native timer, and sound — but keeps activeSession,
      // alarmFired etc. alive so UI can still read them during transitions.
      // Does NOT cancel the native alarm — let it fire to post the notification.
      clearTimerMechanics: () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        stopNativeTimer();

        set({
          isRunning: false,
          alarmSoundPlaying: false,
          startTimestamp: null,
          endTimestamp: null,
          remainingMs: null,
          paused: false,
        });
      },

      // Clears the UI-visible state (activeSession, alarmFired).
      // Call after navigation is complete.
      clearUIState: () => {
        set({
          alarmFired: false,
          activeSession: null,
        });
      },

      pauseTimer: () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        cancelNativeAlarm("timer");

        const { isRunning, endTimestamp, mode, startTimestamp } = get();
        if (!startTimestamp || !isRunning) return;

        const now = Date.now();

        const frozeMS =
          mode === "countup"
            ? now - startTimestamp
            : Math.max(0, endTimestamp! - now);

        // Format frozen time for notification
        const totalSec = Math.floor(frozeMS / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        const frozenTime =
          h > 0
            ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
            : `${m}:${String(s).padStart(2, "0")}`;

        const label = get().activeSession?.label ?? "";
        pauseNativeTimer(
          frozenTime,
          `${label} — ${t("timer:timer.notification.pauseTimer")}`,
          t("timer:timer.notification.resumeTimer"),
        );

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

        const isHabit = get().activeSession?.type === "habit";
        if (mode === "countup") {
          startNativeTimer(now - remainingMs, label, "countup", t("timer:timer.notification.inProgress"), t("timer:timer.notification.pauseTimer"));
        } else {
          startNativeTimer(now + remainingMs, label, "countdown", t("timer:timer.notification.timeRemaining"), t("timer:timer.notification.pauseTimer"), isHabit ? "" : t("timer:timer.notification.extendTimer"));
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
            t("timer:timer.notification.stopAlarm"),
            t("timer:timer.notification.extendTimer")
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

      snoozedTimer: (endTimestamp: number, durationSeconds: number) => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        const now = Date.now();

        set({
          isRunning: true,
          alarmFired: false,
          alarmSoundPlaying: false,
          startTimestamp: now,
          endTimestamp,
          mode: "countdown",
          totalDuration: durationSeconds,
          paused: false,
        });

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
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Restart the JS interval if the timer was running before the app died.
        // The interval closure is lost on crash/restart — this recreates it.
        if (state.isRunning && !interval) {
          const { mode, endTimestamp } = state;

          interval = setInterval(() => {
            const s = useTimerStore.getState();
            if (!s.isRunning) return;

            if (
              mode === "countdown" &&
              endTimestamp &&
              Date.now() >= endTimestamp
            ) {
              useTimerStore.setState({
                alarmFired: true,
                isRunning: false,
                alarmSoundPlaying: true,
              });
              stopNativeTimer();
              if (interval) {
                clearInterval(interval);
                interval = null;
              }
              return;
            }

            useTimerStore.setState((prev) => ({ uiTick: prev.uiTick + 1 }));
          }, 1000);

          // Also restart the native foreground timer so the notification shows
          const label = state.activeSession?.label ?? "";
          if (mode === "countup" && state.startTimestamp) {
            startNativeTimer(
              state.startTimestamp,
              label,
              "countup",
              t("timer:timer.notification.inProgress"),
              t("timer:timer.notification.pauseTimer"),
            );
          } else if (mode === "countdown" && endTimestamp) {
            const isHabit = state.activeSession?.type === "habit";
            startNativeTimer(
              endTimestamp,
              label,
              "countdown",
              t("timer:timer.notification.timeRemaining"),
              t("timer:timer.notification.pauseTimer"),
              isHabit ? "" : t("timer:timer.notification.extendTimer"),
            );
          }
        }
      },
    }
  )
);

// Listen for native pause button press
DeviceEventEmitter.addListener("TIMER_STOPPED", () => {
  useTimerStore.getState().pauseTimer();
});

// Listen for native +1 min button press
DeviceEventEmitter.addListener("TIMER_EXTENDED", () => {
  const state = useTimerStore.getState();
  if (state.mode === "countdown" && state.endTimestamp && state.isRunning) {
    const newEnd = state.endTimestamp + 60 * 1000;
    const label = state.activeSession?.label ?? t("timer:timer.title");

    useTimerStore.setState({
      endTimestamp: newEnd,
      totalDuration: state.totalDuration + 60,
    });

    // Restart native timer with new end time
    startNativeTimer(
      newEnd,
      label,
      "countdown",
      t("timer:timer.notification.timeRemaining"),
      t("timer:timer.notification.pauseTimer"),
      t("timer:timer.notification.extendTimer"),
    );

    // Reschedule alarm
    cancelNativeAlarm("timer");
    scheduleNativeAlarm(
      newEnd,
      "timer",
      label,
      "timer",
      "",
      t("timer:timer.notification.tapToOpenTimer"),
      t("timer:timer.notification.timesUp"),
      t("timer:timer.notification.stopAlarm"),
      t("timer:timer.notification.extendTimer"),
    );
  }
});

// Listen for native resume button press
DeviceEventEmitter.addListener("TIMER_RESUMED", () => {
  const state = useTimerStore.getState();
  if (state.paused && state.remainingMs) {
    const label = state.activeSession?.label ?? t("timer:timer.title");
    useTimerStore.getState().resumeTimer(label);
  }
});
