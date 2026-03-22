"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useHabitStats } from "@/features/habits/hooks/useHabitStats";
import { useHabitLogs } from "@/features/habits/hooks/useHabitLogs";
import { useDeleteHabit } from "@/features/habits/hooks/useDeleteHabit";
import { useArchiveHabit } from "@/features/habits/hooks/useArchiveHabit";
import StatsCard from "@/features/habits/components/StatsCard";
import MonthGrid from "@/features/habits/components/MonthGrid";
import Spinner from "@/components/spinner";
import LinkButton from "@/components/buttons/LinkButton";
import toast from "react-hot-toast";

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default function HabitDetailPage() {
  const { t } = useTranslation("habits");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: stats, isLoading: statsLoading } = useHabitStats(id);
  const { mutate: deleteHabit } = useDeleteHabit();
  const { mutate: archiveHabit } = useArchiveHabit();

  const habit = habits?.find((h) => h.id === id);

  const { start, end } = getMonthRange(currentYear, currentMonth);
  const { data: logs } = useHabitLogs({ startDate: start, endDate: end, habitId: id });

  const formatDuration = useMemo(() => {
    if (!habit?.target_value) return "";
    const h = Math.floor(habit.target_value / 3600);
    const m = Math.floor((habit.target_value % 3600) / 60);
    if (h > 0) return `${h}${t("habits.hours")} ${m}${t("habits.minutes")}`;
    return `${m}${t("habits.minutes")}`;
  }, [habit?.target_value, t]);

  // Month navigation
  const earliestCreated = habit ? new Date(habit.created_at) : null;
  const canGoPrev = earliestCreated
    ? currentYear > earliestCreated.getFullYear() ||
      (currentYear === earliestCreated.getFullYear() &&
        currentMonth > earliestCreated.getMonth())
    : true;
  const canGoNext =
    currentYear < now.getFullYear() ||
    (currentYear === now.getFullYear() && currentMonth < now.getMonth());

  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const handleDelete = () => {
    if (!window.confirm(t("habits.deleteConfirm"))) return;
    deleteHabit(id, {
      onSuccess: () => {
        toast.success(t("habits.deleted"));
        router.push("/habits");
      },
      onError: () => toast.error(t("habits.errorDeleting")),
    });
  };

  const handleArchive = () => {
    if (!window.confirm(t("habits.archiveConfirm"))) return;
    archiveHabit(id, {
      onSuccess: () => {
        toast.success(t("habits.archived"));
        router.push("/habits");
      },
      onError: () => toast.error(t("habits.errorArchiving")),
    });
  };

  if (habitsLoading || statsLoading) {
    return (
      <div className="page-padding min-h-full max-w-md mx-auto flex justify-center pt-20">
        <Spinner />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="page-padding min-h-full max-w-md mx-auto">
        <p className="text-center font-body text-slate-400 mt-20">{t("habits.noHabits")}</p>
      </div>
    );
  }

  return (
    <div className="page-padding min-h-full max-w-md mx-auto flex flex-col justify-between">
      <div>
      <h1 className="text-center mb-6 text-2xl">{habit.name}</h1>

      {/* Stats */}
      {stats && (
        <div className="mb-6">
          <StatsCard stats={stats} />
        </div>
      )}

      {/* Habit info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
        <h3 className="mb-3">{t("habits.habitInfo")}</h3>
        <div className="flex flex-col gap-2 font-body text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">{t("habits.type")}</span>
            <span className="text-slate-200">
              {habit.type === "manual"
                ? t("habits.typeManual")
                : habit.type === "duration"
                  ? t("habits.typeDuration")
                  : t("habits.stepsReadOnly")}
            </span>
          </div>
          {habit.type === "duration" && habit.target_value && (
            <div className="flex justify-between">
              <span className="text-slate-400">{t("habits.target")}</span>
              <span className="text-slate-200">{formatDuration}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">{t("habits.frequency")}</span>
            <span className="text-slate-200">
              {habit.frequency_days
                ? `${habit.frequency_days.length} ${t("habits.stats.days")}`
                : t("habits.frequencyDaily")}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar with navigation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
        <MonthGrid
          year={currentYear}
          month={currentMonth}
          habits={habits ?? []}
          logs={logs ?? []}
          habitId={id}
          showNavigation
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
        />
      </div>

      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-6">
        <LinkButton href={`/habits/edit?id=${id}`}>
          {t("habits.editHabit")}
        </LinkButton>
        <button
          onClick={handleArchive}
          className="btn-neutral w-full py-3 rounded-lg text-center cursor-pointer"
        >
          {t("habits.archive")}
        </button>
        <button
          onClick={handleDelete}
          className="btn-danger w-full py-3 rounded-lg text-center cursor-pointer"
        >
          {t("habits.delete")}
        </button>
      </div>
    </div>
  );
}
