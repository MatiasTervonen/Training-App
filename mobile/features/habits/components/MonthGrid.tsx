import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { DayStatus, Habit, HabitLog } from "@/types/habit";
import { countScheduledHabits } from "@/features/habits/utils/isHabitScheduled";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type MonthGridProps = {
  year: number;
  month: number; // 0-indexed
  logs: HabitLog[];
  habits?: Habit[];
  totalHabits?: number;
  selectedDate?: string;
  onDayPress?: (date: string) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  showNavigation?: boolean;
  habitId?: string;
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday-first (0=Mon, 6=Sun)
  return day === 0 ? 6 : day - 1;
}

function formatDate(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function isDurationLogCompleted(log: HabitLog, habits: Habit[]) {
  const habit = habits.find((h) => h.id === log.habit_id);
  if (habit?.type === "duration" && habit.target_value) {
    return (log.accumulated_seconds ?? 0) >= habit.target_value;
  }
  return true; // non-duration logs are always "completed" if they exist
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
  // Filter to only actually completed logs
  const completedLogs = dayLogs.filter((log) => isDurationLogCompleted(log, habits));

  if (habitId) {
    return completedLogs.length > 0 ? "all" : "none";
  }

  const uniqueHabits = new Set(completedLogs.map((log) => log.habit_id)).size;

  if (uniqueHabits === 0) return "none";
  if (uniqueHabits >= totalHabits) return "all";
  return "partial";
}

function getStatusColor(status: DayStatus) {
  switch (status) {
    case "all":
      return "bg-green-500";
    case "partial":
      return "bg-yellow-500";
    case "none":
      return "bg-gray-600";
    case "empty":
      return "";
  }
}

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

export default function MonthGrid({
  year,
  month,
  logs,
  habits,
  totalHabits,
  selectedDate,
  onDayPress,
  onPrevMonth,
  onNextMonth,
  canGoPrev = true,
  canGoNext = true,
  showNavigation = false,
  habitId,
}: MonthGridProps) {
  const { t } = useTranslation("habits");
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = new Date().toLocaleDateString("en-CA");

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  // Pad to fill last row
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View className="mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-center mb-3">
        {showNavigation && onPrevMonth && (
          <AnimatedButton onPress={onPrevMonth} className="px-3 py-1" disabled={!canGoPrev}>
            <ChevronLeft size={20} color={canGoPrev ? "#f3f4f6" : "#374151"} />
          </AnimatedButton>
        )}
        <AppText className="text-lg font-bold text-center flex-1">
          {t(`months.${MONTH_KEYS[month]}`)} {year}
        </AppText>
        {showNavigation && onNextMonth && (
          <AnimatedButton onPress={onNextMonth} className="px-3 py-1" disabled={!canGoNext}>
            <ChevronRight size={20} color={canGoNext ? "#f3f4f6" : "#374151"} />
          </AnimatedButton>
        )}
      </View>

      {/* Day labels */}
      <View className="flex-row mb-1">
        {DAY_KEYS.map((key) => (
          <View key={key} className="flex-1 items-center">
            <AppText className="text-xs text-gray-400">{t(`days_short.${key}`)}</AppText>
          </View>
        ))}
      </View>

      {/* Day cells */}
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row">
          {row.map((day, colIndex) => {
            if (day === null) {
              return <View key={`empty-${colIndex}`} className="flex-1 items-center py-1" />;
            }

            const date = formatDate(year, month, day);
            const isFuture = date > today;
            const scheduledCount = habits
              ? countScheduledHabits(habits, date)
              : (totalHabits ?? 0);
            const status = isFuture ? "empty" : getDayStatus(date, logs, scheduledCount, habits ?? [], habitId);
            const isSelected = date === selectedDate;
            const isToday = date === today;
            const statusColor = getStatusColor(status);

            return (
              <View key={day} className="flex-1 items-center py-1">
                <AnimatedButton
                  onPress={() => onDayPress?.(date)}
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isSelected ? "border-2 border-blue-400" : ""
                  }`}
                  disabled={!onDayPress}
                >
                  {status !== "empty" && (
                    <View
                      className={`absolute w-8 h-8 rounded-full ${statusColor} ${
                        status === "partial" ? "opacity-50" : "opacity-30"
                      }`}
                    />
                  )}
                  <AppText
                    className={`text-sm ${
                      isToday ? "font-bold text-blue-400" : "text-gray-200"
                    }`}
                  >
                    {day}
                  </AppText>
                </AnimatedButton>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
