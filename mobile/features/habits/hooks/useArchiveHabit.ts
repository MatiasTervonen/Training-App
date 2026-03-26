import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveHabit } from "@/database/habits/archive-habit";
import { refreshHabitFeed } from "@/database/habits/refresh-habit-feed";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useHabitContextStore } from "@/features/habits/hooks/useHabitTimer";
import { cancelNativeAlarm } from "@/native/android/NativeAlarm";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTrackingDate } from "@/lib/formatDate";

export function useArchiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      // Clear timer if this habit is running
      const ctx = useHabitContextStore.getState().context;
      if (ctx?.habitId === habitId) {
        cancelNativeAlarm("timer");
        useTimerStore.getState().clearEverything();
        useHabitContextStore.getState().setContext(null);
        await AsyncStorage.removeItem("habit-timer-context");
      }

      await archiveHabit(habitId);
      const today = getTrackingDate();
      await refreshHabitFeed(today);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
