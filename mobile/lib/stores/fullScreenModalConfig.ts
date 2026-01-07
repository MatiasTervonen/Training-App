import { create } from "zustand";

type FullScreenModalConfig = {
  swipeEnabled?: boolean;
};

type Store = {
  fullScreenModalConfig: FullScreenModalConfig | null;
  setFullScreenModalConfig: (config: FullScreenModalConfig | null) => void;
  setSwipeEnabled: (enabled: boolean) => void;
};

export const useFullScreenModalConfig = create<Store>((set) => ({
  fullScreenModalConfig: null,
  setFullScreenModalConfig: (config) => set({ fullScreenModalConfig: config }),

  setSwipeEnabled: (enabled) =>
    set((state) => ({
      fullScreenModalConfig: {
        ...state.fullScreenModalConfig,
        swipeEnabled: enabled,
      },
    })),
}));
