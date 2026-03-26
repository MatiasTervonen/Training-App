import { View } from "react-native";
import AppText from "@/components/AppText";
import HabitRow from "@/features/habits/components/HabitRow";
import { Habit, HabitLog } from "@/types/habit";
import { isHabitScheduledForDate } from "@/features/habits/utils/isHabitScheduled";
import { useHabitTimer } from "@/features/habits/hooks/useHabitTimer";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { getTrackingDate } from "@/lib/formatDate";

type HabitChecklistProps = {
  habits: Habit[];
  logs: HabitLog[];
  selectedDate: string;
  onToggle: (habitId: string, date: string) => void;
  currentSteps?: number;
};

export default function HabitChecklist({
  habits,
  logs,
  selectedDate,
  onToggle,
  currentSteps,
}: HabitChecklistProps) {
  const { t } = useTranslation("habits");
  const router = useRouter();
  const {
    startHabitTimer,
    pauseHabitTimer,
    activeHabitId,
    habitTimerState,
  } = useHabitTimer();

  const scheduledHabits = useMemo(
    () => habits.filter((h) => isHabitScheduledForDate(h, selectedDate)),
    [habits, selectedDate],
  );

  // Build completed set: for duration habits, only count as completed
  // when accumulated_seconds >= target_value
  const completedSet = useMemo(() => {
    const set = new Set<string>();
    const todayLogs = logs.filter((log) => log.completed_date === selectedDate);

    for (const log of todayLogs) {
      const habit = habits.find((h) => h.id === log.habit_id);
      if (
        habit?.type === "duration" &&
        habit.target_value &&
        (log.accumulated_seconds ?? 0) < habit.target_value
      ) {
        continue; // Duration habit not yet completed
      }
      set.add(log.habit_id);
    }
    return set;
  }, [logs, selectedDate, habits]);

  const isToday = selectedDate === getTrackingDate();

  const handleToggle = useCallback(
    (habitId: string) => onToggle(habitId, selectedDate),
    [onToggle, selectedDate],
  );

  const handlePress = useCallback(
    (habitId: string) => router.push(`/habits/${habitId}`),
    [router],
  );

  const getAccumulatedSeconds = useCallback(
    (habitId: string) => {
      const log = logs.find(
        (l) => l.habit_id === habitId && l.completed_date === selectedDate,
      );
      return log?.accumulated_seconds ?? 0;
    },
    [logs, selectedDate],
  );

  return (
    <View>
      <AppText className="text-lg font-bold mb-2">
        {isToday ? t("todayHabits") : selectedDate}
      </AppText>
      {scheduledHabits.length === 0 ? (
        <AppText className="text-gray-400">{t("noHabits")}</AppText>
      ) : (
        <View>
          {scheduledHabits.map((habit) => {
            const isDuration = habit.type === "duration";
            const thisHabitTimerState =
              isDuration && activeHabitId === habit.id
                ? habitTimerState
                : "idle";

            return (
              <HabitRow
                key={habit.id}
                habit={habit}
                isCompleted={completedSet.has(habit.id)}
                onToggle={() => handleToggle(habit.id)}
                onPress={() => handlePress(habit.id)}
                currentSteps={
                  isToday && habit.type === "steps" ? currentSteps : undefined
                }
                accumulatedSeconds={
                  isDuration ? getAccumulatedSeconds(habit.id) : undefined
                }
                habitTimerState={thisHabitTimerState}
                onStartTimer={
                  isDuration && isToday
                    ? () =>
                        startHabitTimer(
                          habit,
                          getAccumulatedSeconds(habit.id),
                        )
                    : undefined
                }
                onPauseTimer={isDuration ? pauseHabitTimer : undefined}
                onResumeTimer={isDuration && isToday ? () => startHabitTimer(habit, getAccumulatedSeconds(habit.id)) : undefined}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
