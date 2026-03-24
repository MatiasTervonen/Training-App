import {
  View,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTimer } from "@/database/timer/get-timers";
import { useState, useMemo, useCallback } from "react";
import { timers } from "@/types/models";
import FullScreenModal from "@/components/FullScreenModal";
import TimerCard from "@/features/timer/cards/TimerCard";
import { deleteTimer } from "@/database/timer/delete-timer";
import { updateTimer } from "@/database/timer/update-timer";
import Toast from "react-native-toast-message";
import { TimerPicker } from "react-native-timer-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTimerStore } from "@/lib/stores/timerStore";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppInput from "@/components/AppInput";
import SubNotesInput from "@/components/SubNotesInput";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useTranslation } from "react-i18next";
import { Timer } from "lucide-react-native";

export default function MyTimersScreen() {
  const { t } = useTranslation(["timer"]);
  const [expandedItem, setExpandedItem] = useState<timers | null>(null);
  const [editingItem, setEditingItem] = useState<timers | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPickerDuration, setEditPickerDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const setActiveSession = useTimerStore((s) => s.setActiveSession);
  const startTimer = useTimerStore((s) => s.startTimer);

  const activeSession = useTimerStore((state) => state.activeSession);

  const queryClient = useQueryClient();

  const {
    data: timers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["timers"],
    queryFn: getTimer,
  });

  const handleDeleteTimer = async (timerId: string) => {
    try {
      await deleteTimer(timerId);

      queryClient.invalidateQueries({ queryKey: ["timers"], exact: true });
      Toast.show({ type: "success", text1: t("timer.deleteSuccess") });
    } catch {
      Toast.show({
        type: "error",
        text1: t("timer.deleteError"),
      });
    }
  };

  const openEditModal = (timer: timers) => {
    const total = timer.time_seconds;
    setEditTitle(timer.title);
    setEditNotes(timer.notes || "");
    setEditPickerDuration({
      hours: Math.floor(total / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
    });
    setEditingItem(timer);
    setExpandedItem(null);
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditTitle("");
    setEditNotes("");
    setEditPickerDuration({ hours: 0, minutes: 0, seconds: 0 });
  };

  const editDurationInSeconds =
    editPickerDuration.hours * 3600 + editPickerDuration.minutes * 60 + editPickerDuration.seconds;

  const autoSaveData = useMemo(
    () => ({
      title: editTitle,
      notes: editNotes,
      durationInSeconds: editDurationInSeconds,
    }),
    [editTitle, editNotes, editDurationInSeconds],
  );

  const handleAutoSave = useCallback(
    async (data: { title: string; notes: string; durationInSeconds: number }) => {
      if (!editingItem || !data.title || data.durationInSeconds === 0) {
        throw new Error("Invalid data");
      }

      await updateTimer({
        id: editingItem.id,
        title: data.title,
        durationInSeconds: data.durationInSeconds,
        notes: data.notes,
      });

      queryClient.invalidateQueries({ queryKey: ["timers"], exact: true });
    },
    [editingItem, queryClient],
  );

  const { status, hasPendingChanges } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: !!editingItem,
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
        <View className="items-center mt-[20%] px-8">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
              <Timer size={36} color="#94a3b8" />
            </View>
            <AppText className="text-xl text-center mb-3">
              {t("timer.noTimers")}
            </AppText>
            <AppText className="text-sm text-gray-400 text-center leading-5">
              {t("timer.noTimersDesc")}
            </AppText>
          </View>
        </View>
      ) : (
        timers?.map((timer) => (
          <View key={timer.id} className="mb-4">
            <AnimatedButton
              className="btn-base py-2 items-center"
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
          confirmBeforeClose={hasPendingChanges}
        >
          <View className="flex-1" onTouchStart={Keyboard.dismiss}>
            <PageContainer className="justify-between">
              <AutoSaveIndicator status={status} />
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
              <View className="items-center bg-[#0c1425] rounded-2xl border border-slate-700/50 py-4 px-2 overflow-hidden" onTouchStart={(e) => e.stopPropagation()}>
                <TimerPicker
                  initialValue={editPickerDuration}
                  onDurationChange={setEditPickerDuration}
                  LinearGradient={LinearGradient}
                  padWithNItems={2}
                  hourLabel={t("timer.h")}
                  minuteLabel={t("timer.m")}
                  secondLabel={t("timer.s")}
                  pickerFeedback={() => Haptics.selectionAsync()}
                  styles={{
                    theme: "dark",
                    backgroundColor: "transparent",
                    pickerItem: {
                      fontSize: 28,
                      color: "#94a3b8",
                    },
                    selectedPickerItem: {
                      fontSize: 34,
                      color: "#f1f5f9",
                    },
                    pickerLabel: {
                      fontSize: 14,
                      color: "#64748b",
                      marginTop: 0,
                    },
                    pickerContainer: {
                      marginRight: 6,
                    },
                  }}
                />
              </View>
            </View>
            <AnimatedButton
              className="btn-neutral py-2"
              label={t("common:common.cancel")}
              onPress={() => setEditingItem(null)}
            />
            </PageContainer>
          </View>
        </FullScreenModal>
      )}
    </PageContainer>
  );
}
