import { create } from "zustand";

type AppReadyStore = {
  feedReady: boolean;
  setFeedReady: () => void;
  resetFeedReady: () => void;
};

export const useAppReadyStore = create<AppReadyStore>()((set) => ({
  feedReady: false,
  setFeedReady: () => set({ feedReady: true }),
  resetFeedReady: () => set({ feedReady: false }),
}));
