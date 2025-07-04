// store/timerStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ActiveSession = {
  label: string;
  path: string;
  type: string;
};

interface TimerState {
  activeSession: ActiveSession | null;
  isRunning: boolean;
  elapsedTime: number;
  totalDuration: number;
  alarmFired: boolean;
  setActiveSession: (session: ActiveSession | null) => void;
  startTimer: (totalDuration: number) => void;
  stopTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  setAlarmFired: (fired: boolean) => void;
}

let interval: NodeJS.Timeout | null = null;

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      isRunning: false,
      elapsedTime: 0,
      totalDuration: 0,
      alarmFired: false,

      setActiveSession: (session) => set({ activeSession: session }),

      startTimer: (totalDuration) => {
        if (interval) clearInterval(interval);

        const { elapsedTime } = get();

        set({
          isRunning: true,
          totalDuration,
          elapsedTime,
          alarmFired: false,
        });

        interval = setInterval(() => {
          const { elapsedTime, totalDuration, isRunning } = get();
          if (!isRunning) return;

          const newElapsed = elapsedTime + 1;

          set({ elapsedTime: newElapsed });

          if (totalDuration > 0 && newElapsed >= totalDuration) {
            clearInterval(interval!);
            set({ alarmFired: true });
          }
        }, 1000);
      },

      stopTimer: () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        set({
          isRunning: false,
          elapsedTime: 0,
          totalDuration: 0,
          alarmFired: false,
          activeSession: null,
        });
      },

      pauseTimer: () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        set({ isRunning: false });
      },

      resumeTimer: () => {
        if (interval) clearInterval(interval);

        set({ isRunning: true });

        interval = setInterval(() => {
          const { elapsedTime, totalDuration, isRunning } = get();
          if (!isRunning) return;

          const newElapsed = elapsedTime + 1;

          set({ elapsedTime: newElapsed });

          if (totalDuration > 0 && newElapsed >= totalDuration) {
            clearInterval(interval!);
            set({ alarmFired: true, isRunning: false });
          }
        }, 1000);
      },

      setAlarmFired: (fired) => set({ alarmFired: fired }),
    }),
    {
      name: "timer-storage",
    }
  )
);
