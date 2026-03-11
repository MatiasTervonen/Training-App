import { View, ScrollView, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";

import LinkButton from "@/components/buttons/LinkButton";
import HabitChecklist from "@/features/habits/components/HabitChecklist";
import MonthGrid from "@/features/habits/components/MonthGrid";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useHabitLogs } from "@/features/habits/hooks/useHabitLogs";
import { useToggleHabit } from "@/features/habits/hooks/useToggleHabit";
import { useTodaySteps } from "@/features/habits/hooks/useTodaySteps";
import { isHabitScheduledForDate } from "@/features/habits/utils/isHabitScheduled";
import { Confetti } from "react-native-fast-confetti";
import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default function HabitsScreen() {
  const { t } = useTranslation("habits");
  const today = new Date().toLocaleDateString("en-CA");
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const { data: habits = [], isLoading } = useHabits();
  const { start, end } = getMonthRange(currentYear, currentMonth);
  const { data: logs = [] } = useHabitLogs({ startDate: start, endDate: end });
  const toggleMutation = useToggleHabit();
  const currentSteps = useTodaySteps();

  const [showConfetti, setShowConfetti] = useState(false);
  const hasShownConfetti = useRef(false);

  const scheduledToday = useMemo(
    () => habits.filter((h) => isHabitScheduledForDate(h, today)),
    [habits, today],
  );
  const allDoneToday =
    scheduledToday.length > 0 &&
    scheduledToday.every((h) =>
      logs.some((l) => l.habit_id === h.id && l.completed_date === today),
    );

  useEffect(() => {
    if (allDoneToday && !hasShownConfetti.current) {
      hasShownConfetti.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } else if (!allDoneToday) {
      hasShownConfetti.current = false;
    }
  }, [allDoneToday]);

  const handleToggle = useCallback(
    (habitId: string, date: string) => {
      toggleMutation.mutate({ habitId, date });
    },
    [toggleMutation],
  );

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

  return (
    <>
      {showConfetti && (
        <View className="absolute -top-5 -left-5 -right-5 -bottom-10 z-[9999] pointer-events-none">
          <Confetti />
        </View>
      )}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName={
          isLoading || habits.length === 0 ? "flex-1" : undefined
        }
      >
        <PageContainer>
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#9ca3af" />
            </View>
          ) : habits.length === 0 ? (
            <View className="flex-1 justify-between">
              <AppText className="text-2xl text-center mb-6">
                {t("title")}
              </AppText>
              <View className="items-center gap-3">
                <AppText className="text-gray-400 text-lg text-center">
                  {t("noHabits")}
                </AppText>
                <AppText className="text-gray-500 text-center px-4">
                  {t("emptyDescription")}
                </AppText>
              </View>
              <View>
                <LinkButton label={t("createFirst")} href="/habits/create">
                  <Plus size={20} color="#f3f4f6" />
                </LinkButton>
              </View>
            </View>
          ) : (
            <>
              <HabitChecklist
                habits={habits}
                logs={logs}
                selectedDate={selectedDate}
                onToggle={handleToggle}
                currentSteps={currentSteps}
              />

              <View className="mt-6">
                <MonthGrid
                  year={currentYear}
                  month={currentMonth}
                  logs={logs}
                  habits={habits}
                  selectedDate={selectedDate}
                  onDayPress={setSelectedDate}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  canGoPrev={canGoPrev}
                  canGoNext={canGoNext}
                  showNavigation
                />
              </View>
            </>
          )}
        </PageContainer>
      </ScrollView>
      {!isLoading && habits.length > 0 && (
        <View className="px-5 py-3">
          <View className="max-w-md mx-auto w-full">
            <LinkButton label={t("addHabit")} href="/habits/create">
              <Plus size={20} color="#f3f4f6" />
            </LinkButton>
          </View>
        </View>
      )}
    </>
  );
}
