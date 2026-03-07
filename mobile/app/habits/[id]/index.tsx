import { View, ScrollView, Alert } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";

import StatsCard from "@/features/habits/components/StatsCard";
import MonthGrid from "@/features/habits/components/MonthGrid";
import LinkButton from "@/components/buttons/LinkButton";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useHabitLogs } from "@/features/habits/hooks/useHabitLogs";
import { useHabitStats } from "@/features/habits/hooks/useHabitStats";
import { useDeleteHabit } from "@/features/habits/hooks/useDeleteHabit";
import { useArchiveHabit } from "@/features/habits/hooks/useArchiveHabit";
import { useHabitNotifications } from "@/features/habits/hooks/useHabitNotifications";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default function HabitDetailScreen() {
  const { t } = useTranslation("habits");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const { data: habits = [] } = useHabits();
  const habit = habits.find((h) => h.id === id);

  const { start, end } = getMonthRange(currentYear, currentMonth);
  const { data: logs = [] } = useHabitLogs({ startDate: start, endDate: end, habitId: id });
  const { data: stats } = useHabitStats(id);
  const deleteMutation = useDeleteHabit();
  const archiveMutation = useArchiveHabit();
  const { cancelHabitReminder } = useHabitNotifications();

  const now = new Date();
  const createdDate = habit ? new Date(habit.created_at) : null;

  const canGoPrev = createdDate
    ? currentYear > createdDate.getFullYear() ||
      (currentYear === createdDate.getFullYear() && currentMonth > createdDate.getMonth())
    : true;
  const canGoNext = currentYear < now.getFullYear() ||
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

  const handleArchive = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t("archive"), t("archiveConfirm"), [
      { text: t("common:common.cancel"), style: "cancel" },
      {
        text: t("archive"),
        onPress: async () => {
          try {
            await archiveMutation.mutateAsync(id);
            await cancelHabitReminder(id);
            Toast.show({ type: "success", text1: t("archived") });
            router.back();
          } catch {
            Toast.show({ type: "error", text1: t("errorArchiving") });
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t("delete"), t("deleteConfirm"), [
      { text: t("common:common.cancel"), style: "cancel" },
      {
        text: t("common:common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(id);
            await cancelHabitReminder(id);
            Toast.show({ type: "success", text1: t("deleted") });
            router.back();
          } catch {
            Toast.show({ type: "error", text1: t("errorDeleting") });
          }
        },
      },
    ]);
  };

  if (!habit) {
    return (
      <PageContainer>
        <View className="flex-1 items-center justify-center">
          <AppText className="text-gray-400">{t("common:common.loading")}</AppText>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
        <ScrollView className="flex-1">
          <AppText className="text-2xl text-center mb-6">{habit.name}</AppText>
          {habit.type === "steps" && habit.target_value && (
            <View className="bg-gray-800 rounded-lg px-4 py-3 mb-4">
              <AppText className="text-gray-400 text-sm">{t("stepGoal")}</AppText>
              <AppText className="text-lg text-gray-100">
                {habit.target_value.toLocaleString()} {t("steps")}
              </AppText>
            </View>
          )}
          {stats && <StatsCard stats={stats} />}

          <View className="mt-6">
            <MonthGrid
              year={currentYear}
              month={currentMonth}
              logs={logs}
              totalHabits={1}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              showNavigation
              habitId={id}
            />
          </View>
        </ScrollView>

        <View className="gap-3 pt-4">
          {canGoPrev && (
            <LinkButton
              label={t("seeFullHistory")}
              href={`/habits/${id}/history`}
            />
          )}
          <AnimatedButton
            onPress={() => router.push(`/habits/create?id=${id}`)}
            className="btn-base"
            label={t("common:common.edit")}
            textClassName="text-gray-100 text-center"
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <AnimatedButton
                onPress={handleArchive}
                className="btn-neutral"
                label={t("archive")}
                textClassName="text-gray-100 text-center"
              />
            </View>
            <View className="flex-1">
              <AnimatedButton
                onPress={handleDelete}
                className="btn-danger"
                label={t("delete")}
                textClassName="text-gray-100 text-center"
              />
            </View>
          </View>
        </View>
    </PageContainer>
  );
}
