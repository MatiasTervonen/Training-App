import { useUserStore } from "@/lib/stores/useUserStore";

// Get locale based on user's language setting
const getLocale = () => {
  const language = useUserStore.getState().preferences?.language ?? "en";
  return language === "fi" ? "fi-FI" : "en-US";
};

export const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(getLocale(), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

export const formatDateShort = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(getLocale(), {
    month: "short",
    day: "numeric",
  }).format(date);
};

export const formatDateWithYear = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(getLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(getLocale(), {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

export const formatTime = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(getLocale(), {
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

export const formatNotifyTime = (time: string | null) => {
  const locale = getLocale();
  const [hourStr, minuteStr] = time!.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr.padStart(2, "0");

  // Finnish uses 24-hour format, English uses 12-hour with AM/PM
  if (locale === "fi-FI") {
    return `${hour}:${minute}`;
  }

  const isPM = hour >= 12;
  const period = isPM ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${period}`;
};

export const formatMeters = (meters: number) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  } else {
    return `${meters.toFixed(1)} m`;
  }
};

export const formatDuration = (seconds: number) => {
  const locale = getLocale();
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Use localized abbreviations
  const hourLabel = locale === "fi-FI" ? "t" : "h";
  const minLabel = locale === "fi-FI" ? "min" : "m";

  if (hours > 0) {
    return `${hours} ${hourLabel} ${minutes} ${minLabel}`;
  } else {
    return `${minutes} ${minLabel}`;
  }
};

export const formatDurationLong = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  } else {
    return `${m}:${String(s).padStart(2, "0")}`;
  }
};

export const formatAveragePace = (paceSeconds: number) => {
  if (!isFinite(paceSeconds) || paceSeconds <= 0) return "0:00";

  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.floor(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function formatDurationNotesVoice(ms?: number) {
  if (!ms) return "0:00";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
