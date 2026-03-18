export type SessionColors = {
  gradient: [string, string];
  border: string;
  icon: string;
};

export const SESSION_COLORS: Record<string, SessionColors> = {
  gym: {
    gradient: ["rgba(59,130,246,0.25)", "rgba(59,130,246,0.08)"],
    border: "rgba(59,130,246,0.45)",
    icon: "#3b82f6",
  },
  activities: {
    gradient: ["rgba(34,197,94,0.25)", "rgba(34,197,94,0.08)"],
    border: "rgba(34,197,94,0.45)",
    icon: "#22c55e",
  },
  notes: {
    gradient: ["rgba(168,85,247,0.25)", "rgba(168,85,247,0.08)"],
    border: "rgba(168,85,247,0.45)",
    icon: "#a855f7",
  },
  timer: {
    gradient: ["rgba(251,146,60,0.25)", "rgba(251,146,60,0.08)"],
    border: "rgba(251,146,60,0.45)",
    icon: "#fb923c",
  },
  weight: {
    gradient: ["rgba(245,158,11,0.25)", "rgba(245,158,11,0.08)"],
    border: "rgba(245,158,11,0.45)",
    icon: "#f59e0b",
  },
  todo: {
    gradient: ["rgba(6,182,212,0.25)", "rgba(6,182,212,0.08)"],
    border: "rgba(6,182,212,0.45)",
    icon: "#06b6d4",
  },
  reminders: {
    gradient: ["rgba(234,179,8,0.25)", "rgba(234,179,8,0.08)"],
    border: "rgba(234,179,8,0.45)",
    icon: "#eab308",
  },
  habits: {
    gradient: ["rgba(244,63,94,0.25)", "rgba(244,63,94,0.08)"],
    border: "rgba(244,63,94,0.45)",
    icon: "#f43f5e",
  },
  reports: {
    gradient: ["rgba(99,102,241,0.25)", "rgba(99,102,241,0.08)"],
    border: "rgba(99,102,241,0.45)",
    icon: "#6366f1",
  },
};
