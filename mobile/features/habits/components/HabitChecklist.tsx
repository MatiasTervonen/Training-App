import { View } from "react-native";
import AppText from "@/components/AppText";
import HabitRow from "@/features/habits/components/HabitRow";
import { Habit, HabitLog } from "@/types/habit";
import { isHabitScheduledForDate } from "@/features/habits/utils/isHabitScheduled";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";

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

  const scheduledHabits = useMemo(
    () => habits.filter((h) => isHabitScheduledForDate(h, selectedDate)),
    [habits, selectedDate],
  );

  const completedSet = new Set(
    logs
      .filter((log) => log.completed_date === selectedDate)
      .map((log) => log.habit_id),
  );

  const isToday = selectedDate === new Date().toLocaleDateString("en-CA");

  const handleToggle = useCallback(
    (habitId: string) => onToggle(habitId, selectedDate),
    [onToggle, selectedDate],
  );

  const handlePress = useCallback(
    (habitId: string) => router.push(`/habits/${habitId}`),
    [router],
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
          {scheduledHabits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              isCompleted={completedSet.has(habit.id)}
              onToggle={() => handleToggle(habit.id)}
              onPress={() => handlePress(habit.id)}
              currentSteps={
                isToday && habit.type === "steps" ? currentSteps : undefined
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}
