import { View, ScrollView, Pressable, Keyboard, Platform } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import PageContainer from "@/components/PageContainer";

import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useSaveHabit } from "@/features/habits/hooks/useSaveHabit";
import { useEditHabit } from "@/features/habits/hooks/useEditHabit";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useHabitNotifications } from "@/features/habits/hooks/useHabitNotifications";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import DatePicker from "react-native-date-picker";
import Toast from "react-native-toast-message";
import AnimatedButton from "@/components/buttons/animatedButton";
import Toggle from "@/components/toggle";
import { Checkbox } from "expo-checkbox";

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

  const [habitType, setHabitType] = useState<"manual" | "steps">("manual");
  const [name, setName] = useState("");
  const [stepGoal, setStepGoal] = useState("");
  const [frequencyMode, setFrequencyMode] = useState<"daily" | "specific">("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Day labels: 1=Sun, 2=Mon, ..., 7=Sat (Expo notification weekday numbering)
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  // Display order: Mon first
  const displayOrder = [1, 2, 3, 4, 5, 6, 0] as const; // indices into dayKeys

  // Pre-fill when editing
  useEffect(() => {
    if (isEditing) {
      const habit = habits.find((h) => h.id === id);
      if (habit) {
        setHabitType(habit.type);
        if (habit.type === "steps" && habit.target_value) {
          setStepGoal(String(habit.target_value));
        } else {
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
      }
    }
  }, [isEditing, id, habits]);

  const handleSave = async () => {
    if (habitType === "manual" && !name.trim()) return;
    if (habitType === "steps" && (!stepGoal || parseInt(stepGoal, 10) <= 0)) return;

    const isSteps = habitType === "steps";
    const parsedGoal = parseInt(stepGoal, 10);
    const habitName = isSteps
      ? t("stepHabitName", { steps: parsedGoal.toLocaleString() })
      : name.trim();

    const timeStr = !isSteps && reminderEnabled
      ? `${String(reminderTime.getHours()).padStart(2, "0")}:${String(reminderTime.getMinutes()).padStart(2, "0")}:00`
      : null;
    const freqDays = frequencyMode === "specific" && selectedDays.length > 0
      ? selectedDays
      : null;

    setIsSaving(true);
    try {
      if (isEditing) {
        await editMutation.mutateAsync({
          habitId: id,
          name: habitName,
          reminderTime: timeStr,
          frequencyDays: freqDays,
          targetValue: isSteps ? parsedGoal : null,
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
          targetValue: isSteps ? parsedGoal : null,
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
  const canSave = isSteps
    ? !!stepGoal && parseInt(stepGoal, 10) > 0
    : !!name.trim();

  return (
    <PageContainer>
      <Pressable onPress={Keyboard.dismiss} className="flex-1">
        <ScrollView className="flex-1">
          <AppText className="text-2xl text-center mb-6">
            {isEditing ? t("editHabit") : t("addHabit")}
          </AppText>

          <View className="gap-10">
            {/* Habit type selector - only show when creating, and only on Android */}
            {!isEditing && Platform.OS === "android" && (
              <View className="gap-4">
                <AppText className="text-lg">{t("habitType")}</AppText>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <AnimatedButton
                      onPress={() => setHabitType("manual")}
                      className={habitType === "manual" ? "btn-base" : "btn-neutral"}
                      label={t("typeManual")}
                      textClassName="text-gray-100"
                    />
                  </View>
                  <View className="flex-1">
                    <AnimatedButton
                      onPress={() => setHabitType("steps")}
                      className={habitType === "steps" ? "btn-base" : "btn-neutral"}
                      label={t("typeSteps")}
                      textClassName="text-gray-100"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Name input (manual) or Step goal input (steps) */}
            <View className="mt-5">
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
                    className={frequencyMode === "daily" ? "btn-base" : "btn-neutral"}
                    label={t("frequencyDaily")}
                    textClassName="text-gray-100"
                  />
                </View>
                <View className="flex-1">
                  <AnimatedButton
                    onPress={() => setFrequencyMode("specific")}
                    className={frequencyMode === "specific" ? "btn-base" : "btn-neutral"}
                    label={t("frequencySpecific")}
                    textClassName="text-gray-100"
                  />
                </View>
              </View>

              {frequencyMode === "specific" && (
                <View>
                  <AppText className="text-gray-400 mb-3">{t("selectDays")}</AppText>
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
                    onToggle={() => setReminderEnabled((v) => !v)}
                  />
                </View>

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
        </ScrollView>

        <View className="pt-4">
          <SaveButton
            onPress={handleSave}
            label={t("save")}
            disabled={!canSave}
          />
        </View>
      </Pressable>
      <FullScreenLoader visible={isSaving} message={t("common:common.saving")} />
    </PageContainer>
  );
}
