"use client";

import { useMemo } from "react";
import { Habit, HabitLog } from "@/types/habit";
import { isHabitScheduledForDate } from "@/features/habits/utils/isHabitScheduled";
import HabitRow from "@/features/habits/components/HabitRow";
import { useTranslation } from "react-i18next";

type HabitChecklistProps = {
  habits: Habit[];
  logs: HabitLog[];
  date: string;
  onToggle: (habitId: string) => void;
  onStartTimer?: (habit: Habit, accumulatedSeconds: number) => void;
  onPauseTimer?: () => void;
  habitTimerState: "idle" | "running" | "paused";
  activeHabitId: string | null;
  elapsedTime: number;
};

export default function HabitChecklist({
  habits,
  logs,
  date,
  onToggle,
  onStartTimer,
  onPauseTimer,
  habitTimerState,
  activeHabitId,
  elapsedTime,
}: HabitChecklistProps) {
  const { t } = useTranslation("habits");

  const scheduledHabits = useMemo(
    () => habits.filter((h) => isHabitScheduledForDate(h, date)),
    [habits, date],
  );

  const logMap = useMemo(() => {
    const map = new Map<string, HabitLog>();
    for (const log of logs) {
      if (log.completed_date === date) {
        map.set(log.habit_id, log);
      }
    }
    return map;
  }, [logs, date]);

  const completedSet = useMemo(() => {
    const set = new Set<string>();
    for (const habit of scheduledHabits) {
      const log = logMap.get(habit.id);
      if (!log) continue;

      if (habit.type === "duration") {
        if (
          habit.target_value &&
          log.accumulated_seconds !== null &&
          log.accumulated_seconds >= habit.target_value
        ) {
          set.add(habit.id);
        }
      } else {
        set.add(habit.id);
      }
    }
    return set;
  }, [scheduledHabits, logMap]);

  const completedCount = completedSet.size;
  const totalCount = scheduledHabits.length;

  if (scheduledHabits.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="font-body text-slate-400">{t("habits.noHabits")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary */}
      <div className="text-center mb-2">
        <p className="font-body text-slate-300">
          {completedCount} / {totalCount} {t("habits.completed")}
        </p>
        {completedCount === totalCount && totalCount > 0 && (
          <p className="text-green-400 mt-1">{t("habits.allDone")}</p>
        )}
      </div>

      {/* Habit rows */}
      {scheduledHabits.map((habit) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          completed={completedSet.has(habit.id)}
          log={logMap.get(habit.id)}
          onToggle={() => onToggle(habit.id)}
          onStartTimer={() => {
            const log = logMap.get(habit.id);
            onStartTimer?.(habit, log?.accumulated_seconds ?? 0);
          }}
          onPauseTimer={onPauseTimer}
          habitTimerState={habitTimerState}
          activeHabitId={activeHabitId}
          elapsedTime={elapsedTime}
        />
      ))}
    </div>
  );
}
