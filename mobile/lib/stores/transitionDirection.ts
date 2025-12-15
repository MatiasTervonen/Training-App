import { create } from "zustand";

type TransitionDirectionStore = {
  direction: number;
  setDirection: (dir: number) => void;
};

export const useTransitionDirectionStore = create<TransitionDirectionStore>(
  (set) => ({
    direction: 0,
    setDirection: (dir: number) => {
      set({ direction: dir });
    },
  }),
);
