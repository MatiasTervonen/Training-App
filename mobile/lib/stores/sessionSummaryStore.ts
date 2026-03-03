import { create } from "zustand";
import { ExerciseEntry } from "@/types/session";

export type SessionSummary = {
  title: string;
  date: string;
  duration: number;
  exercises: ExerciseEntry[];
  notes: string;
  weightUnit: string;
};

interface SessionSummaryStore {
  summary: SessionSummary | null;
  setSummary: (summary: SessionSummary) => void;
  clearSummary: () => void;
}

export const useSessionSummaryStore = create<SessionSummaryStore>((set) => ({
  summary: null,
  setSummary: (summary) => set({ summary }),
  clearSummary: () => set({ summary: null }),
}));
