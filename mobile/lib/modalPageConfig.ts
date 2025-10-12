import { create } from "zustand";

type ModalPageConfig = {
  rightLabel: string;
  leftLabel: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

type Store = {
  modalPageConfig: ModalPageConfig | null;
  setModalPageConfig: (config: ModalPageConfig | null) => void;
};

export const useModalPageConfig = create<Store>((set) => ({
  modalPageConfig: null,
  setModalPageConfig: (config) => set({ modalPageConfig: config }),
}));
