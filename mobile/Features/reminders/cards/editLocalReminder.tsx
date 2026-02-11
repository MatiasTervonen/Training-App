import { useState, useEffect } from "react";
import SubNotesInput from "@/components/SubNotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import AppText from "@/components/AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus } from "lucide-react-native";
import { formatDateTime, formatTime } from "@/lib/formatDate";
import PageContainer from "@/components/PageContainer";
import { Checkbox } from "expo-checkbox";
import { FeedItemUI } from "@/types/session";
import useSaveReminder from "@/features/reminders/hooks/edit-reminder/useSaveReminder";
import useSetNotification from "@/features/reminders/hooks/edit-reminder/useSetNotification";
import { canUseExactAlarm } from "@/native/android/EnsureExactAlarmPermission";
import Toggle from "@/components/toggle";
import { useTranslation } from "react-i18next";
import { Dot } from "lucide-react-native";

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
  const payload = reminder.extra_fields as unknown as reminderPayload;

  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(payload.notes);
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date>(() => {
    if (payload.notify_date) {
      return new Date(payload.notify_date);
    }

    if (payload.notify_at_time) {
      const base = new Date();

      const [h, m, s] = payload.notify_at_time.split(":").map(Number);

      base.setHours(h, m, s || 0);

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

  const originalNotifyAt = payload.notify_date
    ? new Date(payload.notify_date).getTime()
    : payload.notify_at_time
      ? (() => { const b = new Date(); const [h, m, s] = payload.notify_at_time.split(":").map(Number); b.setHours(h, m, s || 0); return b.getTime(); })()
      : new Date().getTime();
  const hasChanges =
    title !== reminder.title ||
    notes !== payload.notes ||
    notifyAt.getTime() !== originalNotifyAt ||
    JSON.stringify(weekdays) !== JSON.stringify(payload.weekdays || []) ||
    mode !== (payload.mode || "normal");

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

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

  const { handleSave } = useSaveReminder({
    title,
    notes: notes || "",
    notifyAt,
    setIsSaving,
    reminder,
    type: payload.type,
    onSave,
    onClose,
    scheduleNotifications,
    weekdays,
    mode,
  });

  return (
    <View className="flex-1">
      {hasChanges && (
        <View className="bg-gray-900 absolute top-5 left-5 z-50 py-1 px-4 flex-row items-center rounded-lg">
          <AppText className="text-sm text-yellow-500">{t("common:common.unsavedChanges")}</AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <PageContainer className="justify-between mb-5">
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
            <AnimatedButton
              label={
                notifyAt ? formattedNotifyAt : t("reminders.setNotifyTime")
              }
              onPress={() => setOpen(true)}
              className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 flex-row gap-2 justify-center items-center mt-10"
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
            title={payload.type === "one-time" ? t("common:datePicker.selectDateTime") : t("common:datePicker.selectTime")}
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
                <AppText>{t("reminders.repeatOnDays")}</AppText>
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
                            setWeekdays([...weekdays, dayNumber]);
                          } else {
                            setWeekdays(
                              weekdays.filter((day) => day !== dayNumber),
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
              <AppText>{t("reminders.enableHighPriority")}</AppText>
              <AppText className="text-gray-400 text-sm">
                {t("reminders.highPriorityDescription")}
              </AppText>
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
        <View className="pt-10">
          <SaveButton onPress={handleSave} />
        </View>
        <FullScreenLoader
          visible={isSaving}
          message={t("reminders.savingReminder")}
        />
      </PageContainer>
    </TouchableWithoutFeedback>
    </View>
  );
}
