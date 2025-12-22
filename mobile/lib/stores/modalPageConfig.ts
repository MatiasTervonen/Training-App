import { create } from "zustand";

type ModalPageConfig = {
  rightLabel?: string;
  leftLabel?: string;
  swipeEnabled?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

type Store = {
  modalPageConfig: ModalPageConfig | null;
  setModalPageConfig: (config: ModalPageConfig | null) => void;
  setSwipeEnabled: (enabled: boolean) => void;
};

export const useModalPageConfig = create<Store>((set) => ({
  modalPageConfig: null,
  setModalPageConfig: (config) => set({ modalPageConfig: config }),

  setSwipeEnabled: (enabled) =>
    set((state) => ({
      modalPageConfig: { ...state.modalPageConfig, swipeEnabled: enabled },
    })),
}));
