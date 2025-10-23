import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { useQuery } from "@tanstack/react-query";
import GetTimer from "@/api/timer/get-timers";
import SaveButton from "@/components/SaveButton";
import { useState } from "react";
import { timers } from "@/types/models";
import FullScreenModal from "@/components/FullScreenModal";
import TimerCard from "@/components/cards/TimerCard";
import DeleteTimer from "@/api/timer/delete-timer";
import { confirmAction } from "@/lib/confirmAction";
import Toast from "react-native-toast-message";
import { handleError } from "@/utils/handleError";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTimerStore } from "@/lib/stores/timerStore";

export default function MyTimersScreen() {
  const [expandedItem, setExpandedItem] = useState<timers | null>(null);

  const { setActiveSession, startTimer } = useTimerStore();

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
  });

  const handleDeleteTimer = async (timerId: string) => {
    const confirmDelete = await confirmAction({
      title: "Delete Timer",
      message:
        "Are you sure you want to delete this timer? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmDelete) return;

    try {
      await DeleteTimer(timerId);

      Toast.show({ type: "success", text1: "Timer deleted successfully" });
    } catch (error) {
      console.error("Error deleting timer:", error);
      handleError(error, {
        message: "Failed to delete timer",
        route: "/mobile/app/timer/my-timers/index.tsx",
        method: "DELETE",
      });
      Toast.show({
        type: "error",
        text1: "Failed to delete timer. Please try again.",
      });
    }
  };

  const startSavedTimer = (timer: timers) => {
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
      <AppText className="text-2xl text-center my-10">My Timers</AppText>

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
          <View key={timer.id} className="mb-4 ">
            <SaveButton onPress={() => {
              setExpandedItem(timer);
            }} label={timer.title} />
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
            onExpand={() => {
              // Handle expand logic here if needed
              console.log("Expand template:", expandedItem.id);
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
