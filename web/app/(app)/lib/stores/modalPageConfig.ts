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

  blockSwipe: boolean;
  setBlockSwipe: (block: boolean) => void;
};

export const useModalPageConfig = create<Store>((set) => ({
  modalPageConfig: null,
  blockSwipe: false,
  setModalPageConfig: (config) => set({ modalPageConfig: config }),
  setBlockSwipe: (block) => set({ blockSwipe: block }),
}));
