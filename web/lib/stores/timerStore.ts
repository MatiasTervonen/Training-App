// store/timerStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
  started_at: number;
};

type SessionMode = "countup" | "countdown";

interface TimerState {
  activeSession: ActiveSession | null;
  isRunning: boolean;
  elapsedTime: number;
  totalDuration: number;
  alarmFired: boolean;
  startTimestamp: number | null;
  alarmSoundPlaying: boolean;
  mode: SessionMode | null;
  remainingMs: number | null;
  paused: boolean;
  setActiveSession: (session: NewSession) => void;
  startTimer: (totalDuration: number) => void;
  startSession: () => void;
  stopTimer: () => void;
  clearEverything: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  setAlarmFired: (fired: boolean) => void;
  setAlarmSoundPlaying: (playing: boolean) => void;
}

type NewSession = Omit<ActiveSession, "started_at">;

let worker: Worker | null = null;

function getWorker(): Worker | null {
  if (typeof window === "undefined") return null;

  if (!worker) {
    worker = new Worker("/timer-worker.js");
    worker.onmessage = (e) => {
      const { type, elapsed } = e.data;

      if (type === "tick") {
        useTimerStore.setState({ elapsedTime: elapsed });
      } else if (type === "alarm") {
        useTimerStore.setState({
          alarmFired: true,
          alarmSoundPlaying: true,
          isRunning: false,
        });
        showTimerNotification();
      }
    };
  }

  return worker;
}

function showTimerNotification() {
  if (typeof window === "undefined") return;
  if (document.visibilityState === "visible") return;
  if (Notification.permission !== "granted") return;

  new Notification("Timer", {
    body: "Time is up!",
    icon: "/favicon/favicon.ico",
  });
}

function startWorker(
  startTimestamp: number,
  mode: SessionMode,
  totalDuration: number,
) {
  const w = getWorker();
  if (!w) return;
  w.postMessage({ type: "start", startTimestamp, mode, totalDuration });
}

function stopWorker() {
  const w = getWorker();
  if (!w) return;
  w.postMessage({ type: "stop" });
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      isRunning: false,
      elapsedTime: 0,
      totalDuration: 0,
      alarmFired: false,
      alarmSoundPlaying: false,
      startTimestamp: null,
      mode: null,
      remainingMs: null,
      paused: false,

      setActiveSession: (session: NewSession) =>
        set({
          activeSession: {
            ...session,
            started_at: Date.now(),
          },
        }),
      setAlarmSoundPlaying: (playing) => set({ alarmSoundPlaying: playing }),

      startSession: () => {
        stopWorker();

        const now = Date.now();

        set({
          isRunning: true,
          mode: "countup",
          startTimestamp: now,
          elapsedTime: 0,
          remainingMs: null,
          alarmFired: false,
          paused: false,
        });

        startWorker(now, "countup", 0);
      },

      startTimer: (totalDuration) => {
        stopWorker();

        const now = Date.now();

        set({
          isRunning: true,
          mode: "countdown",
          totalDuration,
          elapsedTime: 0,
          alarmFired: false,
          startTimestamp: now,
          paused: false,
        });

        startWorker(now, "countdown", totalDuration);
      },

      stopTimer: () => {
        stopWorker();

        set((state) => ({
          isRunning: false,
          elapsedTime: state.totalDuration,
          alarmFired: false,
          alarmSoundPlaying: false,
          activeSession: null,
          startTimestamp: null,
          remainingMs: null,
          paused: false,
        }));
      },

      clearEverything: () => {
        stopWorker();

        set({
          isRunning: false,
          elapsedTime: 0,
          totalDuration: 0,
          alarmFired: false,
          alarmSoundPlaying: false,
          activeSession: null,
          startTimestamp: null,
          mode: null,
          remainingMs: null,
          paused: false,
        });
      },

      pauseTimer: () => {
        stopWorker();

        const { startTimestamp, mode } = get();
        if (startTimestamp) {
          const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
          const frozenMs = mode === "countup"
            ? Date.now() - startTimestamp
            : elapsed * 1000;

          set({
            elapsedTime: elapsed,
            isRunning: false,
            startTimestamp: null,
            remainingMs: frozenMs,
            paused: true,
          });
        }
      },

      resumeTimer: () => {
        stopWorker();

        const now = Date.now();
        const { elapsedTime, startTimestamp, mode, remainingMs, totalDuration } = get();

        let newElapsed = elapsedTime;
        let newStart = now;

        if (startTimestamp) {
          newElapsed = Math.floor((now - startTimestamp) / 1000);
          newStart = startTimestamp;
        } else if (remainingMs !== null && mode === "countup") {
          newStart = now - remainingMs;
          newElapsed = Math.floor(remainingMs / 1000);
        } else {
          newStart = now - elapsedTime * 1000;
        }

        set({
          isRunning: true,
          startTimestamp: newStart,
          elapsedTime: newElapsed,
          remainingMs: null,
          paused: false,
        });

        startWorker(newStart, mode ?? "countup", totalDuration);
      },

      setAlarmFired: (fired) => set({ alarmFired: fired }),
    }),
    {
      name: "timer-store",
    }
  )
);
