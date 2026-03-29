import { create } from "zustand";
import { getTrackingDate } from "@/lib/formatDate";

type NutritionDateStore = {
  date: string;
  setDate: (date: string) => void;
};

export const useNutritionDateStore = create<NutritionDateStore>((set) => ({
  date: getTrackingDate(),
  setDate: (date: string) => set({ date }),
}));
