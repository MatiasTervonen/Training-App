export const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(date);
};

export const formatDateShort = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

export const formatDateTime = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

export function formatDateFin(dateString: string): string {
  const date = new Date(dateString);

  // Get weekday in Finnish (e.g., "torstai")
  const weekday = new Intl.DateTimeFormat("fi-FI", { weekday: "long" }).format(
    date
  );

  // Get date in dd.MM.yyyy with leading zeros
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${weekday.slice(0, 2)} ${day}.${month}.${year}`;
}

export const formatDateWeek = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  }).format(date);
};

export const formatNotifyTime = (time: string | null) => {
  const [hourStr, minuteStr] = time!.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr.padStart(2, "0");

  const isPM = hour >= 12;
  const period = isPM ? "PM" : "AM";

  return `${hour}:${minute} ${period}`;
};

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatWeekdays(weekdays: number[]) {
  if (!weekdays || weekdays.length === 0) return null;

  return weekdays.map((day) => days[day - 1]).join(", ");
}
