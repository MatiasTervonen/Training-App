"use client";

import { useTranslation } from "react-i18next";
import { useHabits } from "@/features/habits/hooks/useHabits";
import Spinner from "@/components/spinner";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { Repeat } from "lucide-react";
import LinkButton from "@/components/buttons/LinkButton";

export default function MyHabitsPage() {
  const { t } = useTranslation("habits");
  const { data: habits, isLoading } = useHabits();

  if (isLoading) {
    return (
      <div className="page-padding min-h-full max-w-md mx-auto flex justify-center pt-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-8 text-2xl">{t("habits.myHabits")}</h1>

      {!habits || habits.length === 0 ? (
        <div>
          <EmptyState
            icon={Repeat}
            title={t("habits.noHabits")}
            description={t("habits.emptyDescription")}
          />
          <div className="mt-6">
            <LinkButton href="/habits/create">{t("habits.createFirst")}</LinkButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {habits.map((habit) => (
            <Link
              key={habit.id}
              href={`/habits/${habit.id}`}
              className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-500 transition-colors"
            >
              <div>
                <p className="text-gray-100">{habit.name}</p>
                <p className="text-xs font-body text-slate-400 mt-1">
                  {habit.type === "manual"
                    ? t("habits.typeManual")
                    : habit.type === "duration"
                      ? t("habits.typeDuration")
                      : t("habits.stepsReadOnly")}
                  {habit.frequency_days
                    ? ` · ${habit.frequency_days.length} ${t("habits.stats.days")}`
                    : ` · ${t("habits.frequencyDaily")}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
