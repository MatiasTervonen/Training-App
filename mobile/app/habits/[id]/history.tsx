import { View, FlatList } from "react-native";
import AppText from "@/components/AppText";
import StatsCard from "@/features/habits/components/StatsCard";
import MonthGrid from "@/features/habits/components/MonthGrid";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useHabitLogs } from "@/features/habits/hooks/useHabitLogs";
import { useHabitStats } from "@/features/habits/hooks/useHabitStats";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams } from "expo-router";
import { useState, useCallback, useMemo } from "react";

type MonthItem = {
  year: number;
  month: number;
  key: string;
};

function generateMonths(
  count: number,
  startYear: number,
  startMonth: number,
  earliestYear?: number,
  earliestMonth?: number,
): MonthItem[] {
  const months: MonthItem[] = [];
  let y = startYear;
  let m = startMonth;

  for (let i = 0; i < count; i++) {
    // Stop if we've gone past the earliest month
    if (earliestYear !== undefined && earliestMonth !== undefined) {
      if (y < earliestYear || (y === earliestYear && m < earliestMonth)) break;
    }
    months.push({ year: y, month: m, key: `${y}-${m}` });
    m--;
    if (m < 0) {
      m = 11;
      y--;
    }
  }

  return months;
}

export default function HabitHistoryScreen() {
  const { t } = useTranslation("habits");
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: habits = [] } = useHabits();
  const habit = habits.find((h) => h.id === id);
  const { data: stats } = useHabitStats(id);

  const [monthCount, setMonthCount] = useState(6);

  const createdDate = habit ? new Date(habit.created_at) : null;
  const earliestYear = createdDate?.getFullYear();
  const earliestMonth = createdDate?.getMonth();

  const months = useMemo(() => {
    const now = new Date();
    return generateMonths(monthCount, now.getFullYear(), now.getMonth(), earliestYear, earliestMonth);
  }, [monthCount, earliestYear, earliestMonth]);

  // Get the full date range for all months
  const startDate = useMemo(() => {
    const last = months[months.length - 1];
    return `${last.year}-${String(last.month + 1).padStart(2, "0")}-01`;
  }, [months]);

  const endDate = useMemo(() => {
    const first = months[0];
    const lastDay = new Date(first.year, first.month + 1, 0).getDate();
    return `${first.year}-${String(first.month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }, [months]);

  const { data: logs = [] } = useHabitLogs({ startDate, endDate, habitId: id });

  const reachedEnd = months.length < monthCount;

  const handleLoadMore = useCallback(() => {
    if (reachedEnd) return;
    setMonthCount((c) => c + 6);
  }, [reachedEnd]);

  const renderMonth = useCallback(
    ({ item }: { item: MonthItem }) => (
      <MonthGrid
        year={item.year}
        month={item.month}
        logs={logs}
        habits={habit ? [habit] : undefined}
        totalHabits={1}
        habitId={id}
      />
    ),
    [logs, id, habit],
  );

  return (
    <FlatList
      data={months}
      renderItem={renderMonth}
      keyExtractor={(item) => item.key}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      className="flex-1"
      ListHeaderComponent={
        <View className="mb-4">
          <AppText className="text-2xl text-center mb-6">
            {habit?.name ?? t("title")}
          </AppText>
          {stats && <StatsCard stats={stats} />}
        </View>
      }
    />
  );
}
