export interface LinkTarget {
  key: string;
  labelEn: string;
  labelFi: string;
  route: string;
  iconSvg: string; // Lucide icon SVG inner elements
}

function lucideSvg(inner: string, color: string = "#f1f5f9"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

// Lucide icon paths (from lucide-static)
const ICONS = {
  dumbbell: `<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/>`,
  notebookPen: `<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>`,
  timer: `<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>`,
  activity: `<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>`,
  scale: `<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>`,
  bell: `<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>`,
  listChecks: `<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>`,
  repeat2: `<path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/>`,
  messageCircle: `<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>`,
} as const;

export const LINK_TARGETS: LinkTarget[] = [
  {
    key: "gym",
    labelEn: "Gym",
    labelFi: "Sali",
    route: "gym",
    iconSvg: lucideSvg(ICONS.dumbbell),
  },
  {
    key: "notes",
    labelEn: "Notes",
    labelFi: "Muistiinpanot",
    route: "notes/quick-notes",
    iconSvg: lucideSvg(ICONS.notebookPen),
  },
  {
    key: "timer",
    labelEn: "Timer",
    labelFi: "Ajastin",
    route: "timer",
    iconSvg: lucideSvg(ICONS.timer),
  },
  {
    key: "activities",
    labelEn: "Activities",
    labelFi: "Aktiviteetit",
    route: "activities",
    iconSvg: lucideSvg(ICONS.activity),
  },
  {
    key: "weight",
    labelEn: "Weight",
    labelFi: "Paino",
    route: "weight/tracking",
    iconSvg: lucideSvg(ICONS.scale),
  },
  {
    key: "reminders",
    labelEn: "Reminders",
    labelFi: "Muistutukset",
    route: "reminders",
    iconSvg: lucideSvg(ICONS.bell),
  },
  {
    key: "todo",
    labelEn: "Todo",
    labelFi: "Tehtävät",
    route: "todo",
    iconSvg: lucideSvg(ICONS.listChecks),
  },
  {
    key: "habits",
    labelEn: "Habits",
    labelFi: "Tavat",
    route: "habits",
    iconSvg: lucideSvg(ICONS.repeat2),
  },
  {
    key: "chat",
    labelEn: "Chat",
    labelFi: "Chat",
    route: "chat",
    iconSvg: lucideSvg(ICONS.messageCircle),
  },
];

export interface QuickLinksConfig {
  selectedLinks: string[]; // keys from LINK_TARGETS
}

export interface StepsConfig {
  showGoal: boolean;
  dailyGoal: number;
}

export const DEFAULT_QUICK_LINKS_CONFIG: QuickLinksConfig = {
  selectedLinks: ["gym", "notes", "timer", "activities"],
};

export const DEFAULT_STEPS_CONFIG: StepsConfig = {
  showGoal: true,
  dailyGoal: 10000,
};
