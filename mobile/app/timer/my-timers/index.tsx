import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import GetTimer from "@/database/timer/get-timers";
import { useState } from "react";
import { timers } from "@/types/models";
import FullScreenModal from "@/components/FullScreenModal";
import TimerCard from "@/components/cards/TimerCard";
import DeleteTimer from "@/database/timer/delete-timer";
import Toast from "react-native-toast-message";

import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTimerStore } from "@/lib/stores/timerStore";
import AnimatedButton from "@/components/buttons/animatedButton";

export default function MyTimersScreen() {
  const [expandedItem, setExpandedItem] = useState<timers | null>(null);

  const { setActiveSession, startTimer } = useTimerStore();

  const activeSession = useTimerStore((state) => state.activeSession);

  const queryClient = useQueryClient();

  const {
    data: timers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["timers"],
    queryFn: GetTimer,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const handleDeleteTimer = async (timerId: string) => {
    try {
      await DeleteTimer(timerId);

      queryClient.refetchQueries({ queryKey: ["timers"], exact: true });
      Toast.show({ type: "success", text1: "Timer deleted successfully" });
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to delete timer. Please try again.",
      });
    }
  };

  const startSavedTimer = (timer: timers) => {
    if (activeSession) {
      Toast.show({
        type: "error",
        text1: "You already have an active session.",
        text2: "Finish it before starting a new one.",
      });
      return;
    }

    AsyncStorage.setItem(
      "timer_session_draft",
      JSON.stringify({
        title: timer.title,
        notes: timer.notes,
        durationInSeconds: timer.time_seconds,
      })
    );
    setActiveSession({
      type: "timer",
      label: timer.title,
      path: "/timer/empty-timer",
    });

    startTimer(timer.time_seconds);
    router.push("/timer/empty-timer");
  };

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">My Timers</AppText>

      {isLoading ? (
        <View className="gap-3 items-center justify-center mt-20">
          <AppText className="text-center text-gray-300 text-xl">
            Loading timers...
          </AppText>
          <ActivityIndicator size="large" color="#ccc" />
        </View>
      ) : error ? (
        <AppText className="text-center text-red-500 mt-20 text-xl">
          Error loading timers. Please try again.
        </AppText>
      ) : timers && timers.length === 0 ? (
        <AppText className="text-center text-gray-300 mt-20 text-xl">
          No timers found. Create a new timer to get started!
        </AppText>
      ) : (
        timers?.map((timer) => (
          <View key={timer.id} className="mb-4">
            <AnimatedButton
              className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 items-center"
              textClassName="text-gray-100"
              onPress={() => {
                setExpandedItem(timer);
              }}
              label={timer.title}
            />
          </View>
        ))
      )}

      {expandedItem && (
        <FullScreenModal
          isOpen={!!expandedItem}
          onClose={() => setExpandedItem(null)}
        >
          <TimerCard
            item={expandedItem}
            onDelete={() => {
              handleDeleteTimer(expandedItem.id);
              setExpandedItem(null);
            }}
            onEdit={() => {
              // Handle edit logic here
              console.log("Edit template:", expandedItem.id);
            }}
            onStarTimer={() => startSavedTimer(expandedItem)}
          />
        </FullScreenModal>
      )}
    </PageContainer>
  );
}
