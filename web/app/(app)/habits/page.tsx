"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useHabitLogs } from "@/features/habits/hooks/useHabitLogs";
import { useToggleHabit } from "@/features/habits/hooks/useToggleHabit";
import { useHabitTimer } from "@/features/habits/hooks/useHabitTimer";
import { isHabitScheduledForDate } from "@/features/habits/utils/isHabitScheduled";
import HabitChecklist from "@/features/habits/components/HabitChecklist";
import MonthGrid from "@/features/habits/components/MonthGrid";
import Spinner from "@/components/spinner";
import LinkButton from "@/components/buttons/LinkButton";
import EmptyState from "@/components/EmptyState";

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default function HabitsPage() {
  const { t } = useTranslation("habits");
  const today = new Date().toLocaleDateString("en-CA");
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const { data: habits = [], isLoading } = useHabits();
  const { start, end } = getMonthRange(currentYear, currentMonth);
  const { data: logs = [] } = useHabitLogs({ startDate: start, endDate: end });
  const { mutate: toggleHabit } = useToggleHabit();
  const {
    startHabitTimer,
    pauseHabitTimer,
    activeHabitId,
    habitTimerState,
    elapsedTime,
  } = useHabitTimer();

  // Check if all habits done today (for celebration message)
  const scheduledToday = useMemo(
    () => habits.filter((h) => isHabitScheduledForDate(h, today)),
    [habits, today],
  );
  const allDoneToday =
    scheduledToday.length > 0 &&
    scheduledToday.every((h) => {
      const log = logs.find((l) => l.habit_id === h.id && l.completed_date === today);
      if (!log) return false;
      if (h.type === "duration" && h.target_value) {
        return (log.accumulated_seconds ?? 0) >= h.target_value;
      }
      return true;
    });

  const handleToggle = useCallback(
    (habitId: string) => {
      toggleHabit({ habitId, date: selectedDate });
    },
    [toggleHabit, selectedDate],
  );

  // Month navigation limits
  const now = new Date();
  const earliestCreated = useMemo(() => {
    if (habits.length === 0) return null;
    return habits.reduce((earliest, h) => {
      const d = new Date(h.created_at);
      return d < earliest ? d : earliest;
    }, new Date(habits[0].created_at));
  }, [habits]);

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

  if (isLoading) {
    return (
      <div className="page-padding min-h-full max-w-md mx-auto flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="page-padding min-h-full max-w-md mx-auto flex flex-col justify-between">
        <EmptyState
          icon={ListChecks}
          title={t("habits.noHabits")}
          description={t("habits.emptyDescription")}
        />
        <div className="mt-6">
          <LinkButton href="/habits/create">{t("habits.createFirst")}</LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="page-padding min-h-full max-w-md mx-auto flex flex-col justify-between">
      <div>
      {/* Habit checklist for selected date */}
      <HabitChecklist
        habits={habits}
        logs={logs}
        date={selectedDate}
        onToggle={handleToggle}
        onStartTimer={startHabitTimer}
        onPauseTimer={pauseHabitTimer}
        habitTimerState={habitTimerState}
        activeHabitId={activeHabitId}
        elapsedTime={elapsedTime}
      />

      {/* Calendar grid */}
      <div className="mt-6">
        <MonthGrid
          year={currentYear}
          month={currentMonth}
          habits={habits}
          logs={logs}
          selectedDate={selectedDate}
          onDayPress={setSelectedDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          showNavigation
        />
      </div>
      </div>

      <div className="mt-6">
        <LinkButton href="/habits/create">
          <Plus size={20} />
          {t("habits.addHabit")}
        </LinkButton>
      </div>
    </div>
  );
}
