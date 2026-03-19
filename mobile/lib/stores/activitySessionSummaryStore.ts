import { create } from "zustand";
import { FullActivitySession } from "@/types/models";

export type ActivitySessionSummary = {
  title: string;
  date: string;
  duration: number;
  activityName: string | null;
  activitySlug: string | null;
  hasRoute: boolean;
  route: FullActivitySession["route"];
  distance: number | null;
  movingTime: number | null;
  averagePace: number | null;
  averageSpeed: number | null;
  steps: number | null;
  calories: number | null;
  isStepRelevant?: boolean;
  isCaloriesRelevant?: boolean;
  sessionId?: string;
};

interface ActivitySessionSummaryStore {
  summary: ActivitySessionSummary | null;
  setSummary: (summary: ActivitySessionSummary) => void;
  clearSummary: () => void;
}

export const useActivitySessionSummaryStore =
  create<ActivitySessionSummaryStore>((set) => ({
    summary: null,
    setSummary: (summary) => set({ summary }),
    clearSummary: () => set({ summary: null }),
  }));
