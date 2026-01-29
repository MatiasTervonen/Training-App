import {
  View,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTimer } from "@/database/timer/get-timers";
import { useState } from "react";
import { timers } from "@/types/models";
import FullScreenModal from "@/components/FullScreenModal";
import TimerCard from "@/Features/expand-session-cards/TimerCard";
import { deleteTimer } from "@/database/timer/delete-timer";
import Toast from "react-native-toast-message";

import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTimerStore } from "@/lib/stores/timerStore";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppInput from "@/components/AppInput";
import SubNotesInput from "@/components/SubNotesInput";
import NumberInput from "@/components/NumberInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import useUpdateTimer from "@/Features/timer/hooks/useUpdateTimer";

export default function MyTimersScreen() {
  const [expandedItem, setExpandedItem] = useState<timers | null>(null);
  const [editingItem, setEditingItem] = useState<timers | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editSeconds, setEditSeconds] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { setActiveSession, startTimer } = useTimerStore();

  const activeSession = useTimerStore((state) => state.activeSession);

  const queryClient = useQueryClient();

  const {
    data: timers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["timers"],
    queryFn: getTimer,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const handleDeleteTimer = async (timerId: string) => {
    try {
      await deleteTimer(timerId);

      queryClient.refetchQueries({ queryKey: ["timers"], exact: true });
      Toast.show({ type: "success", text1: "Timer deleted successfully" });
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to delete timer. Please try again.",
      });
    }
  };

  const openEditModal = (timer: timers) => {
    const minutes = Math.floor(timer.time_seconds / 60);
    const seconds = timer.time_seconds % 60;

    setEditTitle(timer.title);
    setEditNotes(timer.notes || "");
    setEditMinutes(String(minutes));
    setEditSeconds(String(seconds));
    setEditingItem(timer);
    setExpandedItem(null);
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditTitle("");
    setEditNotes("");
    setEditMinutes("");
    setEditSeconds("");
  };

  const { handleUpdateTimer } = useUpdateTimer({
    id: editingItem?.id || "",
    title: editTitle,
    notes: editNotes,
    setIsSaving,
    alarmMinutes: editMinutes,
    alarmSeconds: editSeconds,
    onSuccess: closeEditModal,
  });

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

    startTimer(timer.time_seconds, timer.title);
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
            onEdit={() => openEditModal(expandedItem)}
            onStarTimer={() => startSavedTimer(expandedItem)}
          />
        </FullScreenModal>
      )}

      {editingItem && (
        <FullScreenModal isOpen={!!editingItem} onClose={closeEditModal}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <PageContainer className="justify-between">
              <View className="gap-5">
                <AppText className="text-2xl text-center mb-5">
                  Edit Timer
                </AppText>
                <AppInput
                  label="Title..."
                  value={editTitle}
                  setValue={setEditTitle}
                  placeholder="Timer Title"
                />
                <SubNotesInput
                  label="Notes..."
                  value={editNotes}
                  setValue={setEditNotes}
                  placeholder="Timer notes...(optional)"
                  className="min-h-[60px]"
                />
                <View className="flex-row gap-2 mb-4 w-full">
                  <View className="flex-1">
                    <NumberInput
                      label="Minutes"
                      value={editMinutes}
                      onChangeText={setEditMinutes}
                      placeholder="Minutes"
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <NumberInput
                      label="Seconds"
                      value={editSeconds}
                      onChangeText={setEditSeconds}
                      placeholder="Seconds"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
              <View className="gap-4">
                <SaveButton onPress={handleUpdateTimer} label="Update" />
                <AnimatedButton
                  className="bg-gray-700 rounded-md shadow-md border-2 border-gray-500 py-2"
                  label="Cancel"
                  onPress={() => setEditingItem(null)}
                  textClassName="text-gray-100 text-center"
                />
              </View>
              <FullScreenLoader visible={isSaving} message="Updating timer..." />
            </PageContainer>
          </TouchableWithoutFeedback>
        </FullScreenModal>
      )}
    </PageContainer>
  );
}
