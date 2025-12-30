// store/timerStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
  started_at: number;
};

interface TimerState {
  activeSession: ActiveSession | null;
  isRunning: boolean;
  elapsedTime: number;
  totalDuration: number;
  alarmFired: boolean;
  startTimestamp: number | null;
  alarmSoundPlaying: boolean;
  setActiveSession: (session: NewSession) => void;
  startTimer: (totalDuration: number) => void;
  stopTimer: () => void;
  clearEverything: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  setAlarmFired: (fired: boolean) => void;
  setAlarmSoundPlaying: (playing: boolean) => void;
}

let interval: NodeJS.Timeout | null = null;

type NewSession = Omit<ActiveSession, "started_at">;

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

      setActiveSession: (session: NewSession) =>
        set({
          activeSession: {
            ...session,
            started_at: Date.now(),
          },
        }),
      setAlarmSoundPlaying: (playing) => set({ alarmSoundPlaying: playing }),

      startTimer: (totalDuration) => {
        if (interval) clearInterval(interval);

        const now = Date.now();

        set({
          isRunning: true,
          totalDuration,
          elapsedTime: 0,
          alarmFired: false,
          startTimestamp: now,
        });

        interval = setInterval(() => {
          const { startTimestamp, totalDuration, isRunning } = get();
          if (!isRunning || !startTimestamp) return;

          const newElapsed = Math.floor((Date.now() - startTimestamp) / 1000);
          set({ elapsedTime: newElapsed });

          if (totalDuration > 0 && newElapsed >= totalDuration) {
            clearInterval(interval!);
            set({
              alarmFired: true,
              alarmSoundPlaying: true,
              isRunning: false,
            });
          }
        }, 1000);
      },

      stopTimer: () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        set((state) => ({
          isRunning: false,
          elapsedTime: state.totalDuration,
          alarmFired: false,
          alarmSoundPlaying: false,
          activeSession: null,
          startTimestamp: null,
        }));
      },

      clearEverything: () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        set({
          isRunning: false,
          elapsedTime: 0,
          totalDuration: 0,
          alarmFired: false,
          alarmSoundPlaying: false,
          activeSession: null,
          startTimestamp: null,
        });
      },

      pauseTimer: () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        const { startTimestamp } = get();
        if (startTimestamp) {
          const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
          set({
            elapsedTime: elapsed,
            isRunning: false,
            startTimestamp: null,
          });
        }
      },

      resumeTimer: () => {
        if (interval) clearInterval(interval);

        const now = Date.now();
        const { elapsedTime, startTimestamp } = get();

        let newElapsed = elapsedTime;
        let newStart = now;

        if (startTimestamp) {
          newElapsed = Math.floor((now - startTimestamp) / 1000);
          newStart = startTimestamp; // continue from actual start
        } else {
          newStart = now - elapsedTime * 1000; // fallback
        }

        set({
          isRunning: true,
          startTimestamp: newStart,
          elapsedTime: newElapsed,
        });

        interval = setInterval(() => {
          const { startTimestamp, totalDuration, isRunning } = get();
          if (!isRunning || !startTimestamp) return;

          const newElapsed = Math.floor((Date.now() - startTimestamp) / 1000);
          set({ elapsedTime: newElapsed });

          if (totalDuration > 0 && newElapsed >= totalDuration) {
            clearInterval(interval!);
            set({
              alarmFired: true,
              alarmSoundPlaying: true,
              isRunning: false,
            });
          }
        }, 1000);
      },

      setAlarmFired: (fired) => set({ alarmFired: fired }),
    }),
    {
      name: "timer-store",
    }
  )
);
