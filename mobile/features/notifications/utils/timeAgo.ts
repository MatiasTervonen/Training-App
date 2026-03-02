import { TFunction } from "i18next";

export function getTimeAgo(dateString: string, t: TFunction): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return t("notifications:notifications.timeAgo.now");
  }
  if (diffMinutes < 60) {
    return t("notifications:notifications.timeAgo.minutes", {
      count: diffMinutes,
    });
  }
  if (diffHours < 24) {
    return t("notifications:notifications.timeAgo.hours", {
      count: diffHours,
    });
  }
  return t("notifications:notifications.timeAgo.days", { count: diffDays });
}
