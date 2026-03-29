export type SessionColors = {
  gradient: [string, string];
  border: string;
  icon: string;
};

/** Mix a hex color into the dark background (#0f172a) at the given ratio. */
function mixWithDark(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = 15, dg = 23, db = 42; // #0f172a
  const mr = Math.round(dr + amount * (r - dr));
  const mg = Math.round(dg + amount * (g - dg));
  const mb = Math.round(db + amount * (b - db));
  return `#${mr.toString(16).padStart(2, "0")}${mg.toString(16).padStart(2, "0")}${mb.toString(16).padStart(2, "0")}`;
}

/** Get popup gradient and shadow colors for an active session based on its path/type. */
export function getPopupColorsForSession(session: {
  path: string;
  type: string;
}): { gradient: [string, string]; shadow: string } {
  let colorKey: string | undefined;

  if (session.path.startsWith("/gym")) {
    colorKey = "gym";
  } else if (session.path.startsWith("/activities")) {
    colorKey = "activities";
  } else if (session.type === "habit") {
    colorKey = "habits";
  } else if (session.path.startsWith("/timer")) {
    colorKey = "timer";
  }

  const colors = colorKey ? SESSION_COLORS[colorKey] : undefined;
  if (!colors) {
    return { gradient: ["#0d3326", "#0f172a"], shadow: "#22d3ee" };
  }

  return {
    gradient: [mixWithDark(colors.icon, 0.15), "#0f172a"],
    shadow: colors.icon,
  };
}

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
    gradient: ["rgba(236,72,153,0.25)", "rgba(236,72,153,0.08)"],
    border: "rgba(236,72,153,0.45)",
    icon: "#ec4899",
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
  nutrition: {
    gradient: ["rgba(255,0,255,0.25)", "rgba(255,0,255,0.08)"],
    border: "rgba(255,0,255,0.45)",
    icon: "#ff00ff",
  },
};
