"use client";

import { formatDate } from "@/lib/formatDate";
import { FeedItemUI } from "@/types/session";
import { useTranslation } from "react-i18next";

type HabitPayload = {
  completed: number;
  total: number;
  current_streak: number;
};

export default function HabitSession(item: FeedItemUI) {
  const { t } = useTranslation("habits");
  const { t: tFeed } = useTranslation("feed");
  const payload = item.extra_fields as HabitPayload;
  const allDone = payload.completed === payload.total;

  return (
    <div className="text-center max-w-3xl mx-auto page-padding">
      <div className="flex flex-col gap-2 text-sm text-gray-400 font-body">
        <p>
          {formatDate(item.created_at)}
        </p>
      </div>

      <div className="bg-white/5 px-5 pt-5 pb-10 rounded-md shadow-md mt-5">
        <div className="text-xl text-center mb-6 border-b border-gray-700 pb-2">
          {t("habits.title")}
        </div>

        <div className="flex flex-col gap-4 font-body">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">{tFeed("feed.card.completed")}</span>
            <span className={`text-lg ${allDone ? "text-green-400" : "text-slate-200"}`}>
              {payload.completed} / {payload.total}
            </span>
          </div>

          {payload.current_streak > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">{t("habits.stats.currentStreak")}</span>
              <span className="text-lg text-orange-400">
                {t("habits.feed.streak", { count: payload.current_streak })}
              </span>
            </div>
          )}

          {allDone && (
            <p className="text-green-400 text-center mt-4">{t("habits.allDone")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
