"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Habit, HabitLog, DayStatus } from "@/types/habit";
import { countScheduledHabits } from "@/features/habits/utils/isHabitScheduled";
import { useTranslation } from "react-i18next";
import { getTrackingDate } from "@/lib/formatDate";

type MonthGridProps = {
  year: number;
  month: number; // 0-indexed
  habits: Habit[];
  logs: HabitLog[];
  habitId?: string;
  selectedDate?: string;
  onDayPress?: (date: string) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  showNavigation?: boolean;
};

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// Monday-first: Mon, Tue, Wed, Thu, Fri, Sat, Sun
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday-first (0=Mon, 6=Sun)
  return day === 0 ? 6 : day - 1;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isDurationLogCompleted(log: HabitLog, habits: Habit[]): boolean {
  const habit = habits.find((h) => h.id === log.habit_id);
  if (habit?.type === "duration" && habit.target_value) {
    return (log.accumulated_seconds ?? 0) >= habit.target_value;
  }
  return true;
}

function getDayStatus(
  date: string,
  logs: HabitLog[],
  totalHabits: number,
  habits: Habit[],
  habitId?: string,
): DayStatus {
  if (totalHabits === 0) return "empty";

  const dayLogs = logs.filter((log) => log.completed_date === date);
  const completedLogs = dayLogs.filter((log) => isDurationLogCompleted(log, habits));

  if (habitId) {
    return completedLogs.length > 0 ? "all" : "none";
  }

  const uniqueHabits = new Set(completedLogs.map((log) => log.habit_id)).size;
  if (uniqueHabits === 0) return "none";
  if (uniqueHabits >= totalHabits) return "all";
  return "partial";
}

function getStatusColor(status: DayStatus): string {
  switch (status) {
    case "all":
      return "bg-green-500";
    case "partial":
      return "bg-yellow-500";
    case "none":
      return "bg-slate-600";
    case "empty":
      return "";
  }
}

export default function MonthGrid({
  year,
  month,
  habits,
  logs,
  habitId,
  selectedDate,
  onDayPress,
  onPrevMonth,
  onNextMonth,
  canGoPrev = true,
  canGoNext = true,
  showNavigation = false,
}: MonthGridProps) {
  const { t } = useTranslation("habits");
  const today = getTrackingDate();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const monthKey = MONTH_KEYS[month];

  // Build grid cells
  const cells = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [firstDay, daysInMonth]);

  const rows = useMemo(() => {
    const result: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [cells]);

  return (
    <div>
      {/* Header with month name + navigation */}
      <div className="flex items-center justify-center mb-3">
        {showNavigation && onPrevMonth && (
          <button
            onClick={onPrevMonth}
            disabled={!canGoPrev}
            className="px-3 py-1 cursor-pointer disabled:opacity-30"
          >
            <ChevronLeft size={20} className={canGoPrev ? "text-gray-100" : "text-gray-700"} />
          </button>
        )}
        <h3 className="text-lg text-center flex-1">
          {t(`habits.months.${monthKey}`)} {year}
        </h3>
        {showNavigation && onNextMonth && (
          <button
            onClick={onNextMonth}
            disabled={!canGoNext}
            className="px-3 py-1 cursor-pointer disabled:opacity-30"
          >
            <ChevronRight size={20} className={canGoNext ? "text-gray-100" : "text-gray-700"} />
          </button>
        )}
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_KEYS.map((key) => (
          <div key={key} className="text-center text-xs font-body text-slate-500">
            {t(`habits.days_short.${key}`)}
          </div>
        ))}
      </div>

      {/* Day cells */}
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-7 gap-1">
          {row.map((day, colIndex) => {
            if (day === null) {
              return <div key={`empty-${colIndex}`} className="aspect-square" />;
            }

            const date = formatDate(year, month, day);
            const isFuture = date > today;
            const scheduledCount = countScheduledHabits(habits, date);
            const status = isFuture ? "empty" : getDayStatus(date, logs, scheduledCount, habits, habitId);
            const isSelected = date === selectedDate;
            const isToday = date === today;
            const statusColor = getStatusColor(status);

            return (
              <button
                key={day}
                onClick={() => onDayPress?.(date)}
                disabled={!onDayPress}
                className={`aspect-square rounded-full flex items-center justify-center relative cursor-pointer disabled:cursor-default ${
                  isSelected ? "ring-2 ring-blue-400" : ""
                }`}
              >
                {status !== "empty" && (
                  <div
                    className={`absolute inset-0 rounded-full ${statusColor} ${
                      status === "partial" ? "opacity-50" : "opacity-30"
                    }`}
                  />
                )}
                <span
                  className={`text-sm font-body relative z-10 ${
                    isToday ? "text-blue-400" : "text-gray-200"
                  }`}
                >
                  {day}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
