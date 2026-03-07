import { TFunction } from "i18next";

type WithCreatedAt = { created_at: string };

type Section<T> = {
  title: string;
  data: T[];
};

export function groupByTimePeriod<T extends WithCreatedAt>(
  items: T[],
  t: TFunction,
): Section<T>[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const groups: Record<string, T[]> = {};
  const keys = [
    t("notifications:notifications.sections.today"),
    t("notifications:notifications.sections.yesterday"),
    t("notifications:notifications.sections.thisWeek"),
    t("notifications:notifications.sections.earlier"),
  ];

  for (const item of items) {
    const date = new Date(item.created_at);
    let key: string;

    if (date >= todayStart) {
      key = keys[0];
    } else if (date >= yesterdayStart) {
      key = keys[1];
    } else if (date >= weekStart) {
      key = keys[2];
    } else {
      key = keys[3];
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }

  return keys.filter((key) => groups[key]?.length).map((key) => ({
    title: key,
    data: groups[key],
  }));
}
