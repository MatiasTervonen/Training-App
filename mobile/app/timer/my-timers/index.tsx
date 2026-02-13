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
import TimerCard from "@/features/timer/cards/TimerCard";
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
import useUpdateTimer from "@/features/timer/hooks/useUpdateTimer";
import { useTranslation } from "react-i18next";

export default function MyTimersScreen() {
  const { t } = useTranslation(["timer", "common"]);
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
      Toast.show({ type: "success", text1: t("timer.deleteSuccess") });
    } catch {
      Toast.show({
        type: "error",
        text1: t("timer.deleteError"),
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

  const hasUnsavedChanges = editingItem
    ? editTitle !== editingItem.title ||
      editNotes !== (editingItem.notes || "") ||
      editMinutes !== String(Math.floor(editingItem.time_seconds / 60)) ||
      editSeconds !== String(editingItem.time_seconds % 60)
    : false;

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
        text1: t("timer.activeSessionError"),
        text2: t("timer.activeSessionErrorSub"),
      });
      return;
    }

    AsyncStorage.setItem(
      "timer_session_draft",
      JSON.stringify({
        title: timer.title,
        notes: timer.notes,
        durationInSeconds: timer.time_seconds,
      }),
    );
    setActiveSession({
      type: t("timer.title"),
      label: timer.title,
      path: "/timer/empty-timer",
    });

    startTimer(timer.time_seconds, timer.title);
    router.push("/timer/empty-timer");
  };

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">
        {t("timer.myTimers")}
      </AppText>

      {isLoading ? (
        <View className="gap-3 items-center justify-center mt-20">
          <AppText className="text-center text-gray-300 text-xl">
            {t("timer.loadingTimers")}
          </AppText>
          <ActivityIndicator size="large" color="#ccc" />
        </View>
      ) : error ? (
        <AppText className="text-center text-red-500 mt-20 text-xl">
          {t("timer.errorLoadingTimers")}
        </AppText>
      ) : timers && timers.length === 0 ? (
        <AppText className="text-center text-gray-300 mt-20 text-xl">
          {t("timer.noTimers")}
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
        <FullScreenModal
          isOpen={!!editingItem}
          onClose={closeEditModal}
          confirmBeforeClose={hasUnsavedChanges}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <PageContainer className="justify-between">
              <View className="gap-5">
                <AppText className="text-2xl text-center mb-5">
                  {t("timer.editTimer")}
                </AppText>
                <AppInput
                  label={t("timer.titleLabel")}
                  value={editTitle}
                  setValue={setEditTitle}
                  placeholder={t("timer.titlePlaceholder")}
                />
                <SubNotesInput
                  label={t("timer.notesLabel")}
                  value={editNotes}
                  setValue={setEditNotes}
                  placeholder={t("timer.notesPlaceholder")}
                />
                <View className="flex-row gap-2 mb-4 w-full">
                  <View className="flex-1">
                    <NumberInput
                      label={t("timer.minutes")}
                      value={editMinutes}
                      onChangeText={setEditMinutes}
                      placeholder={t("timer.minutes")}
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <NumberInput
                      label={t("timer.seconds")}
                      value={editSeconds}
                      onChangeText={setEditSeconds}
                      placeholder={t("timer.seconds")}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
              <View className="gap-4">
                <SaveButton
                  onPress={handleUpdateTimer}
                  label={t("timer.update")}
                />
                <AnimatedButton
                  className="bg-gray-700 rounded-md shadow-md border-2 border-gray-500 py-2"
                  label={t("common.cancel")}
                  onPress={() => setEditingItem(null)}
                  textClassName="text-gray-100 text-center"
                />
              </View>
              <FullScreenLoader
                visible={isSaving}
                message={t("timer.updatingTimer")}
              />
            </PageContainer>
          </TouchableWithoutFeedback>
        </FullScreenModal>
      )}
    </PageContainer>
  );
}
