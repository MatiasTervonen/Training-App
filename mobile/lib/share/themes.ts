export type ShareCardThemeId = "classic" | "midnight" | "clean" | "forest";
export type ShareCardSize = "square" | "story" | "wide";

export type ShareCardTheme = {
  id: ShareCardThemeId;
  colors: {
    background: string[];
    gradientStart?: { x: number; y: number };
    gradientEnd?: { x: number; y: number };
    statBoxBorder: string;
    statBoxBg: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
  };
};

export type ShareCardDimensions = {
  width: number;
  height: number;
};

export const SHARE_CARD_DIMENSIONS: Record<ShareCardSize, ShareCardDimensions> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  wide: { width: 1920, height: 1080 },
};

export const SHARE_THEMES: ShareCardTheme[] = [
  {
    id: "classic",
    colors: {
      background: ["#1e3a8a", "#0f172a", "#0f172a"],
      gradientStart: { x: 0.8, y: 0 },
      gradientEnd: { x: 0.2, y: 1 },
      statBoxBorder: "#3b82f6",
      statBoxBg: "rgba(2,6,23,0.5)",
      textPrimary: "#ffffff",
      textSecondary: "#d1d5db",
      textMuted: "#9ca3af",
      accent: "#3b82f6",
    },
  },
  {
    id: "midnight",
    colors: {
      background: ["#000000"],
      statBoxBorder: "#374151",
      statBoxBg: "rgba(17,24,39,0.8)",
      textPrimary: "#ffffff",
      textSecondary: "#d1d5db",
      textMuted: "#9ca3af",
      accent: "#a855f7",
    },
  },
  {
    id: "clean",
    colors: {
      background: ["#ffffff"],
      statBoxBorder: "#e5e7eb",
      statBoxBg: "#f9fafb",
      textPrimary: "#0f172a",
      textSecondary: "#334155",
      textMuted: "#64748b",
      accent: "#2563eb",
    },
  },
  {
    id: "forest",
    colors: {
      background: ["#064e3b", "#022c22", "#022c22"],
      gradientStart: { x: 0.8, y: 0 },
      gradientEnd: { x: 0.2, y: 1 },
      statBoxBorder: "#059669",
      statBoxBg: "rgba(6,78,59,0.5)",
      textPrimary: "#ffffff",
      textSecondary: "#a7f3d0",
      textMuted: "#6ee7b7",
      accent: "#10b981",
    },
  },
];

export function getTheme(id: ShareCardThemeId): ShareCardTheme {
  return SHARE_THEMES.find((t) => t.id === id) ?? SHARE_THEMES[0];
}
