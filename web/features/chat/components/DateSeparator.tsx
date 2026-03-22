"use client";

import { useTranslation } from "react-i18next";

function getDateLabel(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) return t("chat.today");
  if (msgDate.getTime() === yesterday.getTime()) return t("chat.yesterday");
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export default function DateSeparator({ date }: { date: string }) {
  const { t } = useTranslation("chat");

  return (
    <div className="flex justify-center my-3">
      <span className="text-xs text-gray-400 bg-slate-800 px-3 py-1 rounded-full">
        {getDateLabel(date, t)}
      </span>
    </div>
  );
}
