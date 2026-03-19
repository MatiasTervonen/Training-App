import { View, ScrollView, Alert } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";

import StatsCard from "@/features/habits/components/StatsCard";
import MonthGrid from "@/features/habits/components/MonthGrid";
import HabitShareModal from "@/features/habits/components/HabitShareModal";
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
import { SESSION_COLORS } from "@/lib/sessionColors";
import { useState, useCallback } from "react";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { Share2 } from "lucide-react-native";
import { formatDuration } from "@/lib/formatDate";
import { useHabitTimer } from "@/features/habits/hooks/useHabitTimer";

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default function HabitDetailScreen() {
  const { t } = useTranslation("habits");
  const colors = SESSION_COLORS.habits;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const { data: habits = [] } = useHabits();
  const habit = habits.find((h) => h.id === id);

  const { start, end } = getMonthRange(currentYear, currentMonth);
  const { data: logs = [] } = useHabitLogs({
    startDate: start,
    endDate: end,
    habitId: id,
  });
  const { data: stats } = useHabitStats(id);
  const deleteMutation = useDeleteHabit();
  const archiveMutation = useArchiveHabit();
  const { cancelHabitReminder } = useHabitNotifications();
  const [shareVisible, setShareVisible] = useState(false);
  const { activeHabitId } = useHabitTimer();

  const now = new Date();
  const createdDate = habit ? new Date(habit.created_at) : null;

  const canGoPrev = createdDate
    ? currentYear > createdDate.getFullYear() ||
      (currentYear === createdDate.getFullYear() &&
        currentMonth > createdDate.getMonth())
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
          <AppText className="text-gray-400">
            {t("common:common.loading")}
          </AppText>
        </View>
      </PageContainer>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="grow"
    >
      <PageContainer className="justify-between">
        <View>
          <View className="flex-row items-center mb-6">
            <View className="w-8" />
            <AppText className="text-2xl text-center flex-1">{habit.name}</AppText>
            {stats && (
              <AnimatedButton
                onPress={() => setShareVisible(true)}
                hitSlop={10}
                className="ml-3"
              >
                <Share2 color="#9ca3af" size={20} />
              </AnimatedButton>
            )}
            {!stats && <View className="w-8" />}
          </View>
          {habit.type === "steps" && habit.target_value && (
            <View className="bg-slate-500/10 border border-slate-500/20 rounded-lg px-4 py-3 mb-4">
              <AppText className="text-gray-400 text-sm">
                {t("stepGoal")}
              </AppText>
              <AppText className="text-lg">
                {habit.target_value.toLocaleString()} {t("steps")}
              </AppText>
            </View>
          )}
          {habit.type === "duration" && habit.target_value && (
            <View className="bg-slate-500/10 border border-slate-500/20 rounded-lg px-4 py-3 mb-4">
              <AppText className="text-gray-400 text-sm">
                {t("durationTarget")}
              </AppText>
              <AppText className="text-lg">
                {formatDuration(habit.target_value)}
              </AppText>
            </View>
          )}
          {stats && <StatsCard stats={stats} />}
          <View className="mt-6">
            <MonthGrid
              year={currentYear}
              month={currentMonth}
              logs={logs}
              habits={[habit]}
              totalHabits={1}
              selectedDate={new Date().toLocaleDateString("en-CA")}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              showNavigation
              habitId={id}
            />
          </View>
        </View>

        <View className="gap-3 pt-4">
          {canGoPrev && (
            <LinkButton
              label={t("seeFullHistory")}
              href={`/habits/${id}/history`}
              gradientColors={colors.gradient}
              borderColor={colors.border}
            />
          )}
          <AnimatedButton
            onPress={() => {
              if (activeHabitId === id) {
                Toast.show({
                  type: "error",
                  text1: t("cannotEditWhileTimerRunning"),
                });
                return;
              }
              router.push(`/habits/create?id=${id}`);
            }}
            className="btn-edit"
            label={t("common:common.edit")}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <AnimatedButton
                onPress={handleArchive}
                className="btn-neutral"
                label={t("archive")}
              />
            </View>
            <View className="flex-1">
              <AnimatedButton
                onPress={handleDelete}
                className="btn-danger"
                label={t("delete")}
              />
            </View>
          </View>
        </View>
      </PageContainer>
      {stats && (
        <HabitShareModal
          visible={shareVisible}
          onClose={() => setShareVisible(false)}
          habitName={habit.name}
          stats={stats}
        />
      )}
    </ScrollView>
  );
}
