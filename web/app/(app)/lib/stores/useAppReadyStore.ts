import { create } from "zustand";

interface AppReadyStore {
  isAppReady: boolean;
  setAppReady: (ready: boolean) => void;
}

export const useAppReadyStore = create<AppReadyStore>((set) => ({
  isAppReady: false,
  setAppReady: (ready) => set({ isAppReady: ready }),
}));
