import { View, ScrollView, Platform, AppState, Modal } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import AppInput from "@/components/AppInput";
import PageContainer from "@/components/PageContainer";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import InfoModal from "@/components/InfoModal";
import BodyText from "@/components/BodyText";
import LinkButton from "@/components/buttons/LinkButton";
import { Info } from "lucide-react-native";
import { SESSION_COLORS } from "@/lib/sessionColors";

import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useSaveHabit } from "@/features/habits/hooks/useSaveHabit";
import { useEditHabit } from "@/features/habits/hooks/useEditHabit";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useHabitNotifications } from "@/features/habits/hooks/useHabitNotifications";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import DatePicker from "react-native-date-picker";
import Toast from "react-native-toast-message";
import AnimatedButton from "@/components/buttons/animatedButton";
import Toggle from "@/components/toggle";
import { Checkbox } from "expo-checkbox";
import { TimerPickerModal } from "react-native-timer-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useUserStore } from "@/lib/stores/useUserStore";
import {
  canUseExactAlarm,
  requestExactAlarm,
} from "@/native/android/EnsureExactAlarmPermission";

export default function CreateHabitScreen() {
  const { t, i18n } = useTranslation("habits");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const { data: habits = [] } = useHabits();
  const saveMutation = useSaveHabit();
  const editMutation = useEditHabit();
  const { scheduleHabitReminder, cancelHabitReminder } =
    useHabitNotifications();

  const [habitType, setHabitType] = useState<"manual" | "steps" | "duration">(
    "manual",
  );
  const [name, setName] = useState("");
  const [stepGoal, setStepGoal] = useState("");
  const [durationPicker, setDurationPicker] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [alarmType, setAlarmType] = useState<"normal" | "priority">("normal");
  const [frequencyMode, setFrequencyMode] = useState<"daily" | "specific">(
    "daily",
  );
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [durationPickerOpen, setDurationPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [showAlarmModal, setShowAlarmModal] = useState(false);

  const pushEnabled = useUserStore((state) => state.settings?.push_enabled);
  const colors = SESSION_COLORS.habits;
  const showDurationPushModal = habitType === "duration" && pushEnabled === false;

  // Day labels: 1=Sun, 2=Mon, ..., 7=Sat (Expo notification weekday numbering)
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  // Display order: Mon first
  const displayOrder = [1, 2, 3, 4, 5, 6, 0] as const; // indices into dayKeys

  const durationInSeconds =
    durationPicker.hours * 3600 + durationPicker.minutes * 60;

  // Pre-fill when editing
  useEffect(() => {
    if (isEditing) {
      const habit = habits.find((h) => h.id === id);
      if (habit) {
        setHabitType(habit.type);
        if (habit.type === "steps" && habit.target_value) {
          setStepGoal(String(habit.target_value));
        } else if (habit.type === "duration" && habit.target_value) {
          const totalSec = habit.target_value;
          const hours = Math.floor(totalSec / 3600);
          const minutes = Math.floor((totalSec % 3600) / 60);
          setDurationPicker({ hours, minutes, seconds: 0 });
          setAlarmType(habit.alarm_type);
        } else {
          setName(habit.name);
        }
        if (habit.type !== "steps") {
          setName(habit.name);
        }
        if (habit.frequency_days) {
          setFrequencyMode("specific");
          setSelectedDays(habit.frequency_days);
        }
        if (habit.reminder_time) {
          setReminderEnabled(true);
          const [h, m] = habit.reminder_time.split(":");
          const date = new Date();
          date.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
          setReminderTime(date);
        }
        setPrefilled(true);
      }
    }
  }, [isEditing, id, habits]);

  // Re-check alarm permission when returning from system settings
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      const allowed = await canUseExactAlarm();
      if (allowed) {
        setShowAlarmModal(false);
        setAlarmType("priority");
      }
    });
    return () => sub.remove();
  }, []);

  // Disable reminder if push is off
  useEffect(() => {
    if (!pushEnabled && reminderEnabled) {
      setReminderEnabled(false);
    }
  }, [pushEnabled, reminderEnabled]);

  // Auto-save (edit mode only)
  const autoSaveData = useMemo(
    () => ({
      name,
      stepGoal,
      habitType,
      durationInSeconds,
      alarmType,
      frequencyMode,
      selectedDays: [...selectedDays].sort(),
      reminderEnabled,
      reminderTimestamp: reminderTime.getTime(),
    }),
    [
      name,
      stepGoal,
      habitType,
      durationInSeconds,
      alarmType,
      frequencyMode,
      selectedDays,
      reminderEnabled,
      reminderTime,
    ],
  );

  const handleAutoSave = useCallback(async () => {
    if (habitType === "manual" && !name.trim()) return;
    if (habitType === "steps" && (!stepGoal || parseInt(stepGoal, 10) <= 0))
      return;
    if (habitType === "duration" && (durationInSeconds <= 0 || !name.trim()))
      return;

    const isStepsType = habitType === "steps";
    const parsedGoal = parseInt(stepGoal, 10);
    const habitName = isStepsType
      ? t("stepHabitName", { steps: parsedGoal.toLocaleString() })
      : name.trim();

    const timeStr =
      habitType !== "steps" && reminderEnabled
        ? `${String(reminderTime.getHours()).padStart(2, "0")}:${String(reminderTime.getMinutes()).padStart(2, "0")}:00`
        : null;
    const freqDays =
      frequencyMode === "specific" && selectedDays.length > 0
        ? selectedDays
        : null;

    const targetValue = isStepsType
      ? parsedGoal
      : habitType === "duration"
        ? durationInSeconds
        : null;

    await editMutation.mutateAsync({
      habitId: id!,
      name: habitName,
      reminderTime: timeStr,
      frequencyDays: freqDays,
      targetValue,
      alarmType: habitType === "duration" ? alarmType : undefined,
    });

    // Update notification
    await cancelHabitReminder(id!);
    if (timeStr) {
      await scheduleHabitReminder(
        id!,
        habitName,
        timeStr,
        t("reminderBody", { habitName }),
        freqDays,
      );
    }
  }, [
    habitType,
    name,
    stepGoal,
    durationInSeconds,
    alarmType,
    reminderEnabled,
    reminderTime,
    frequencyMode,
    selectedDays,
    id,
    editMutation,
    cancelHabitReminder,
    scheduleHabitReminder,
    t,
  ]);

  const { status } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: isEditing && prefilled,
  });

  const handleSave = async () => {
    if (habitType === "manual" && !name.trim()) return;
    if (habitType === "steps" && (!stepGoal || parseInt(stepGoal, 10) <= 0))
      return;
    if (habitType === "duration" && (durationInSeconds <= 0 || !name.trim()))
      return;

    const isSteps = habitType === "steps";
    const parsedGoal = parseInt(stepGoal, 10);
    const habitName = isSteps
      ? t("stepHabitName", { steps: parsedGoal.toLocaleString() })
      : name.trim();

    const timeStr =
      habitType !== "steps" && reminderEnabled
        ? `${String(reminderTime.getHours()).padStart(2, "0")}:${String(reminderTime.getMinutes()).padStart(2, "0")}:00`
        : null;
    const freqDays =
      frequencyMode === "specific" && selectedDays.length > 0
        ? selectedDays
        : null;

    const targetValue = isSteps
      ? parsedGoal
      : habitType === "duration"
        ? durationInSeconds
        : null;

    setIsSaving(true);
    try {
      if (isEditing) {
        await editMutation.mutateAsync({
          habitId: id,
          name: habitName,
          reminderTime: timeStr,
          frequencyDays: freqDays,
          targetValue,
          alarmType: habitType === "duration" ? alarmType : undefined,
        });

        // Update notification
        await cancelHabitReminder(id);
        if (timeStr) {
          await scheduleHabitReminder(
            id,
            habitName,
            timeStr,
            t("reminderBody", { habitName }),
            freqDays,
          );
        }
      } else {
        const result = await saveMutation.mutateAsync({
          name: habitName,
          reminderTime: timeStr,
          frequencyDays: freqDays,
          sortOrder: habits.length,
          type: habitType,
          targetValue,
          alarmType: habitType === "duration" ? alarmType : "normal",
        });

        if (timeStr && result) {
          await scheduleHabitReminder(
            result.id,
            habitName,
            timeStr,
            t("reminderBody", { habitName }),
            freqDays,
          );
        }
      }

      Toast.show({ type: "success", text1: t("saved") });
      router.back();
    } catch {
      setIsSaving(false);
      Toast.show({ type: "error", text1: t("errorSaving") });
    }
  };

  const formattedTime = `${String(reminderTime.getHours()).padStart(2, "0")}:${String(reminderTime.getMinutes()).padStart(2, "0")}`;

  const isSteps = habitType === "steps";
  const isDuration = habitType === "duration";
  const canSave = isSteps
    ? !!stepGoal && parseInt(stepGoal, 10) > 0
    : isDuration
      ? !!name.trim() && durationInSeconds > 0
      : !!name.trim();

  return (
    <>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <PageContainer>
          <AutoSaveIndicator status={status} />
          <AppText className="text-2xl text-center mb-6">
            {isEditing ? t("editHabit") : t("addHabit")}
          </AppText>

          <View className="gap-8">
            {/* Habit type selector - only show when creating, and only on Android */}
            {!isEditing && Platform.OS === "android" && (
              <View className="gap-4">
                <AppText className="text-lg">{t("habitType")}</AppText>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <AnimatedButton
                      onPress={() => setHabitType("manual")}
                      className={
                        habitType === "manual" ? "btn-base" : "btn-neutral"
                      }
                      label={t("typeManual")}
                      textClassName="text-gray-100"
                    />
                  </View>
                  <View className="flex-1">
                    <AnimatedButton
                      onPress={() => setHabitType("steps")}
                      className={
                        habitType === "steps" ? "btn-base" : "btn-neutral"
                      }
                      label={t("typeSteps")}
                      textClassName="text-gray-100"
                    />
                  </View>
                  <View className="flex-1">
                    <AnimatedButton
                      onPress={() => setHabitType("duration")}
                      className={
                        habitType === "duration" ? "btn-base" : "btn-neutral"
                      }
                      label={t("typeDuration")}
                      textClassName="text-gray-100"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Name input (manual / duration) or Step goal input (steps) */}
            <View>
              {isSteps ? (
                <AppInput
                  value={stepGoal}
                  setValue={setStepGoal}
                  label={t("stepGoal")}
                  placeholder={t("stepGoalPlaceholder")}
                  keyboardType="numeric"
                />
              ) : (
                <AppInput
                  value={name}
                  setValue={setName}
                  label={t("habitName")}
                  placeholder={t("habitNamePlaceholder")}
                />
              )}
            </View>

            {/* Duration picker - only for duration type */}
            {isDuration && (
              <View className="gap-4">
                <AppText className="text-lg">{t("durationTarget")}</AppText>
                <AnimatedButton
                  onPress={() => setDurationPickerOpen(true)}
                  className="btn-neutral px-4 py-3"
                >
                  <AppText className="text-lg text-center">
                    {durationPicker.hours > 0 || durationPicker.minutes > 0
                      ? `${durationPicker.hours}${t("common:common.h", { defaultValue: "h" })} ${durationPicker.minutes}${t("common:common.m", { defaultValue: "m" })}`
                      : t("durationTargetPlaceholder", {
                          defaultValue: "0h 0m",
                        })}
                  </AppText>
                </AnimatedButton>
                <TimerPickerModal
                  visible={durationPickerOpen}
                  setIsVisible={setDurationPickerOpen}
                  onConfirm={({ hours, minutes }) => {
                    setDurationPicker({ hours, minutes, seconds: 0 });
                    setDurationPickerOpen(false);
                  }}
                  onCancel={() => setDurationPickerOpen(false)}
                  initialValue={{
                    hours: durationPicker.hours,
                    minutes: durationPicker.minutes,
                    seconds: 0,
                  }}
                  hideSeconds
                  LinearGradient={LinearGradient}
                  padWithNItems={2}
                  hourLabel={t("common:common.h", { defaultValue: "h" })}
                  minuteLabel={t("common:common.m", { defaultValue: "m" })}
                  modalTitle={t("durationTarget")}
                  confirmButtonText={t("common:datePicker.confirm")}
                  cancelButtonText={t("common:datePicker.cancel")}
                  pickerFeedback={() => Haptics.selectionAsync()}
                  styles={{
                    theme: "dark",
                    backgroundColor: "#1e293b",
                    contentContainer: {
                      width: 300,
                      paddingVertical: 24,
                    },
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
                    modalTitle: {
                      color: "#f1f5f9",
                      fontSize: 18,
                    },
                    confirmButton: {
                      backgroundColor: "#3b82f6",
                      borderColor: "#3b82f6",
                      color: "#f1f5f9",
                      fontSize: 16,
                    },
                    cancelButton: {
                      backgroundColor: "#334155",
                      borderColor: "#475569",
                      color: "#f1f5f9",
                      fontSize: 16,
                    },
                  }}
                />
              </View>
            )}

            {/* Alarm type toggle - only for duration type */}
            {isDuration && (
              <View className="flex-row items-center justify-between">
                <View>
                  <AppText className="text-lg">{t("alarmType")}</AppText>
                  <AppText className="text-gray-400 text-sm">
                    {t("alarmPriorityDesc")}
                  </AppText>
                </View>
                <Toggle
                  isOn={alarmType === "priority"}
                  onToggle={async () => {
                    if (alarmType === "normal") {
                      const allowed = await canUseExactAlarm();
                      if (!allowed) {
                        setShowAlarmModal(true);
                        return;
                      }
                    }
                    setAlarmType((prev) =>
                      prev === "normal" ? "priority" : "normal",
                    );
                  }}
                />
              </View>
            )}

            {/* Frequency selection */}
            <View className="gap-4">
              <AppText className="text-lg">{t("frequency")}</AppText>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <AnimatedButton
                    onPress={() => {
                      setFrequencyMode("daily");
                      setSelectedDays([]);
                    }}
                    className={
                      frequencyMode === "daily" ? "btn-base" : "btn-neutral"
                    }
                    label={t("frequencyDaily")}
                    textClassName="text-gray-100"
                  />
                </View>
                <View className="flex-1">
                  <AnimatedButton
                    onPress={() => setFrequencyMode("specific")}
                    className={
                      frequencyMode === "specific" ? "btn-base" : "btn-neutral"
                    }
                    label={t("frequencySpecific")}
                    textClassName="text-gray-100"
                  />
                </View>
              </View>

              {frequencyMode === "specific" && (
                <View>
                  <AppText className="text-gray-400 mb-3">
                    {t("selectDays")}
                  </AppText>
                  <View className="flex-row justify-between px-2">
                    {displayOrder.map((idx) => {
                      const dayNumber = idx + 1; // 1=Sun, 2=Mon, ..., 7=Sat
                      const isChecked = selectedDays.includes(dayNumber);
                      return (
                        <View key={dayKeys[idx]} className="items-center gap-2">
                          <Checkbox
                            hitSlop={10}
                            value={isChecked}
                            onValueChange={(checked) => {
                              if (checked) {
                                setSelectedDays((prev) => [...prev, dayNumber]);
                              } else {
                                setSelectedDays((prev) =>
                                  prev.filter((d) => d !== dayNumber),
                                );
                              }
                            }}
                          />
                          <AppText className="text-sm text-gray-300">
                            {t(`days_short.${dayKeys[idx]}`)}
                          </AppText>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Reminder toggle - hidden for step habits */}
            {!isSteps && (
              <View className="gap-4">
                <View className="flex-row items-center justify-between">
                  <AppText className="text-lg">{t("reminder")}</AppText>
                  <Toggle
                    isOn={reminderEnabled}
                    onToggle={() => {
                      if (!pushEnabled) return;
                      setReminderEnabled((v) => !v);
                    }}
                    disabled={!pushEnabled}
                  />
                </View>
                {!pushEnabled && (
                  <AppTextNC className="text-gray-400 text-xs">
                    {t("reminderDisabledPush")}{" "}
                    <AppTextNC
                      className="text-blue-400 text-xs underline"
                      onPress={() => router.push("/menu/settings")}
                    >
                      {t("reminderDisabledPushLink")}
                    </AppTextNC>
                  </AppTextNC>
                )}

                {reminderEnabled && (
                  <View>
                    <AppText className="text-gray-400 mb-2">
                      {t("reminderTime")}
                    </AppText>
                    <AnimatedButton
                      onPress={() => setTimePickerOpen(true)}
                      className="btn-neutral px-4 py-3"
                    >
                      <AppText className="text-lg text-center">
                        {formattedTime}
                      </AppText>
                    </AnimatedButton>
                    <DatePicker
                      date={reminderTime}
                      onDateChange={setReminderTime}
                      mode="time"
                      modal
                      open={timePickerOpen}
                      locale={i18n.language}
                      title={t("common:datePicker.selectTime")}
                      confirmText={t("common:datePicker.confirm")}
                      cancelText={t("common:datePicker.cancel")}
                      onConfirm={(date) => {
                        setTimePickerOpen(false);
                        setReminderTime(date);
                      }}
                      onCancel={() => setTimePickerOpen(false)}
                    />
                  </View>
                )}
              </View>
            )}
          </View>

          <View className="flex-1" />

          {!isEditing && (
            <View className="pt-20">
              <SaveButton
                onPress={handleSave}
                label={t("save")}
                disabled={!canSave}
              />
            </View>
          )}
        </PageContainer>
      </ScrollView>
      {!isEditing && (
        <FullScreenLoader
          visible={isSaving}
          message={t("common:common.saving")}
        />
      )}

      <Modal visible={showDurationPushModal} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 px-5">
          <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
            <View className="mb-5">
              <Info size={35} color="#fbbf24" />
            </View>
            <AppText className="text-xl mb-6 text-center">
              {t("durationPushDisabled.title")}
            </AppText>
            <BodyText className="text-lg mb-6 text-center">
              {t("durationPushDisabled.description")}
            </BodyText>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <AnimatedButton
                  onPress={() => setHabitType("manual")}
                  className="btn-neutral"
                  label={t("durationPushDisabled.back")}
                  textClassName="text-gray-100 text-center"
                />
              </View>
              <View className="flex-1">
                <LinkButton
                  href="/menu/settings"
                  label={t("durationPushDisabled.settings")}
                  gradientColors={colors.gradient}
                  borderColor={colors.border}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <InfoModal
        visible={showAlarmModal}
        onClose={() => setShowAlarmModal(false)}
        title={t("alarmPermission.title")}
        description={t("alarmPermission.description")}
        cancelLabel={t("alarmPermission.back")}
        confirmLabel={t("alarmPermission.allow")}
        onConfirm={async () => {
          await requestExactAlarm();
          setShowAlarmModal(false);
        }}
      />
    </>
  );
}
