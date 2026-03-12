import { create } from "zustand";
import { ExerciseEntry } from "@/types/session";

export type SessionSummaryPhase = {
  phase_type: string;
  activity_id: string;
  duration_seconds: number;
  steps: number | null;
  distance_meters: number | null;
  is_manual: boolean;
};

export type SessionSummary = {
  title: string;
  date: string;
  duration: number;
  exercises: ExerciseEntry[];
  notes: string;
  weightUnit: string;
  phases?: SessionSummaryPhase[];
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
