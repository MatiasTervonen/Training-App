import { useState, useEffect, useCallback, useMemo } from "react";
import SubNotesInput from "@/components/SubNotesInput";
import AppInput from "@/components/AppInput";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import AppText from "@/components/AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus } from "lucide-react-native";
import { formatDateTime, formatTime } from "@/lib/formatDate";
import PageContainer from "@/components/PageContainer";
import { Checkbox } from "expo-checkbox";
import { FeedItemUI } from "@/types/session";
import useSetNotification from "@/features/reminders/hooks/edit-reminder/useSetNotification";
import { canUseExactAlarm } from "@/native/android/EnsureExactAlarmPermission";
import Toggle from "@/components/toggle";
import { useTranslation } from "react-i18next";
import AppTextNC from "@/components/AppTextNC";
import { useAutoSave } from "@/hooks/useAutoSave";
import { editLocalReminder } from "@/database/reminders/edit-local-reminder";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  reminder: FeedItemUI;
  onClose: () => void;
  onSave: (updateFeedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

type reminderPayload = {
  notes: string;
  notify_at: Date;
  notify_at_time: string;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
  notify_date: Date;
  mode: "alarm" | "normal";
};

export default function HandleEditLocalReminder({
  reminder,
  onClose,
  onSave,
  onDirtyChange,
}: Props) {
  const { t, i18n } = useTranslation("reminders");
  const queryClient = useQueryClient();
  const payload = reminder.extra_fields as unknown as reminderPayload;

  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(payload.notes ?? "");
  const [notifyAt, setNotifyAt] = useState<Date>(() => {
    if (payload.notify_date) {
      return new Date(payload.notify_date);
    }

    if (payload.notify_at_time) {
      const base = new Date();

      const [h, m, s] = payload.notify_at_time.split(":").map(Number);

      base.setHours(h, m, s || 0, 0);

      return base;
    }

    return new Date();
  });
  const [open, setOpen] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>(payload.weekdays || []);

  const [mode, setMode] = useState<"alarm" | "normal">(
    payload.mode || "normal",
  );

  const days = [
    t("reminders.days.sun"),
    t("reminders.days.mon"),
    t("reminders.days.tue"),
    t("reminders.days.wed"),
    t("reminders.days.thu"),
    t("reminders.days.fri"),
    t("reminders.days.sat"),
  ];

  const formattedNotifyAt =
    payload.type === "one-time"
      ? formatDateTime(notifyAt!)
      : formatTime(notifyAt!);

  const { scheduleNotifications } = useSetNotification({
    notifyAt,
    title,
    reminder,
    notes,
    weekdays,
    type: payload.type,
    mode,
  });

  const autoSaveData = useMemo(
    () => ({
      title,
      notes,
      notifyAtMs: notifyAt.getTime(),
      weekdays: JSON.stringify(weekdays),
      mode,
    }),
    [title, notes, notifyAt, weekdays, mode],
  );

  const handleAutoSave = useCallback(async () => {
    if (title.trim().length === 0 || !notifyAt) {
      throw new Error("Validation failed");
    }

    if (payload.type === "one-time" && notifyAt < new Date()) {
      throw new Error("Validation failed");
    }

    const reminderId = reminder.source_id;
    const updated = new Date().toISOString();

    // Cancel old notifications
    const stored = await AsyncStorage.getItem(`notification:${reminderId}`);
    const oldIds: string[] = stored ? JSON.parse(stored) : [];

    await Promise.all(
      oldIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    );

    const newIds = await scheduleNotifications();
    const normalizedIds = newIds
      ? Array.isArray(newIds)
        ? newIds
        : [newIds]
      : [];

    if (normalizedIds.length) {
      await AsyncStorage.setItem(
        `reminder:${reminderId}`,
        JSON.stringify(normalizedIds),
      );
    }

    const updatedFeedItem = await editLocalReminder({
      id: reminderId,
      title,
      notes,
      seen_at: undefined,
      notify_at_time:
        payload.type === "weekly" || payload.type === "daily"
          ? notifyAt.toTimeString().slice(0, 8)
          : undefined,
      notify_date:
        payload.type === "one-time" ? notifyAt.toISOString() : undefined,
      weekdays,
      type: payload.type as "weekly" | "daily" | "one-time",
      updated_at: updated,
      mode,
    });

    if ("feed_context" in reminder) {
      onSave({
        ...updatedFeedItem,
        feed_context: reminder.feed_context,
      });
    }

    queryClient.invalidateQueries({ queryKey: ["feed"], exact: true });
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
  }, [
    title,
    notes,
    notifyAt,
    weekdays,
    mode,
    payload.type,
    reminder,
    scheduleNotifications,
    onSave,
    queryClient,
  ]);

  const { status, hasPendingChanges } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
  });

  useEffect(() => {
    onDirtyChange?.(hasPendingChanges);
  }, [hasPendingChanges, onDirtyChange]);

  return (
    <View className="flex-1">
      <AutoSaveIndicator status={status} />
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <PageContainer className="justify-between">
          <View>
            <AppText className=" text-xl text-center mb-10 mt-5">
              {t("reminders.editReminder")}
            </AppText>
            <View className="mb-5">
              <AppInput
                value={title || ""}
                onChangeText={setValue}
                placeholder={t("reminders.titlePlaceholder")}
                label={t("reminders.titleLabel")}
              />
            </View>
            <SubNotesInput
              value={notes || ""}
              setValue={setNotes}
              placeholder={t("reminders.notesPlaceholder")}
              label={t("reminders.notesLabel")}
            />
            <View>
              <AppTextNC className="mt-5 mb-1 text-slate-300">
                {t("reminders.notifyTime")}
              </AppTextNC>
              <AnimatedButton
                label={
                  notifyAt ? formattedNotifyAt : t("reminders.setNotifyTime")
                }
                onPress={() => setOpen(true)}
                className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 flex-row gap-2 justify-center items-center"
                textClassName="text-gray-100"
              >
                <Plus color="#f3f4f6" />
              </AnimatedButton>
            </View>
            <DatePicker
              date={notifyAt}
              onDateChange={setNotifyAt}
              mode={payload.type === "one-time" ? "datetime" : "time"}
              modal
              minimumDate={payload.type === "one-time" ? new Date() : undefined}
              open={open}
              locale={i18n.language}
              title={
                payload.type === "one-time"
                  ? t("common:datePicker.selectDateTime")
                  : t("common:datePicker.selectTime")
              }
              confirmText={t("common:datePicker.confirm")}
              cancelText={t("common:datePicker.cancel")}
              onConfirm={(date) => {
                setOpen(false);
                setNotifyAt(date);
              }}
              onCancel={() => {
                setOpen(false);
              }}
            />
            {payload.type === "weekly" && (
              <View className="mt-5">
                <View className="flex-row gap-6">
                  <AppTextNC className="text-gray-300">
                    {t("reminders.repeatOnDays")}
                  </AppTextNC>
                </View>
                <View className="flex-row justify-between mt-3 px-4">
                  {days.map((day, index) => {
                    const dayNumber = index + 1; // Expo weekdays: 1 = Sunday, 7 = Saturday
                    const isChecked = weekdays.includes(dayNumber);

                    return (
                      <View key={day} className="items-center mt-2">
                        <Checkbox
                          hitSlop={10}
                          value={isChecked}
                          onValueChange={(newValue) => {
                            if (newValue) {
                              setWeekdays((prev) => [...prev, dayNumber]);
                            } else {
                              setWeekdays((prev) =>
                                prev.filter((day) => day !== dayNumber),
                              );
                            }
                          }}
                        />
                        <AppText className="mt-2">{day}</AppText>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
            <View className="flex-row items-center justify-between px-4 mt-10">
              <View>
                <AppTextNC className="text-slate-200">
                  {t("reminders.enableHighPriority")}
                </AppTextNC>
                <AppTextNC className="text-slate-400 text-sm">
                  {t("reminders.highPriorityDescription")}
                </AppTextNC>
              </View>
              <Toggle
                isOn={mode === "alarm"}
                onToggle={async () => {
                  const allowed = await canUseExactAlarm();
                  if (!allowed) {
                    return;
                  }

                  setMode(mode === "alarm" ? "normal" : "alarm");
                }}
              />
            </View>
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
    </View>
  );
}
