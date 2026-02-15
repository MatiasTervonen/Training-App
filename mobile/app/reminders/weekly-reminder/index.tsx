import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  AppState,
} from "react-native";
import AppText from "@/components/AppText";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import AppInput from "@/components/AppInput";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageContainer from "@/components/PageContainer";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus, Info } from "lucide-react-native";
import { formatTime } from "@/lib/formatDate";
import { Checkbox } from "expo-checkbox";
import SubNotesInput from "@/components/SubNotesInput";
import useSaveDraftWeekly from "@/features/reminders/hooks/weekly/useSaveDraft";
import useSaveReminderWeekly from "@/features/reminders/hooks/weekly/useSaveReminder";
import useSetNotificationWeekly from "@/features/reminders/hooks/weekly/useSetNotification";
import Toggle from "@/components/toggle";
import { canUseExactAlarm, requestExactAlarm } from "@/native/android/EnsureExactAlarmPermission";
import InfoModal from "@/components/InfoModal";
import { useTranslation } from "react-i18next";

export default function ReminderScreen() {
  const { t, i18n } = useTranslation("reminders");
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [mode, setMode] = useState<"alarm" | "normal">("normal");
  const [showModal, setShowModal] = useState(false);

  const days = [
    t("reminders.days.sun"),
    t("reminders.days.mon"),
    t("reminders.days.tue"),
    t("reminders.days.wed"),
    t("reminders.days.thu"),
    t("reminders.days.fri"),
    t("reminders.days.sat"),
  ];

  const formattedTime = formatTime(notifyAt!);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;

      const allowed = await canUseExactAlarm();

      if (allowed) {
        setShowModal(false);
        setMode("alarm");
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  const resetReminder = () => {
    AsyncStorage.removeItem("weekly_reminder_draft");
    setValue("");
    setNotes("");
    setNotifyAt(null);
    setWeekdays([]);
  };

  // useSaveDraftWeekly hook to save draft weekly reminder
  useSaveDraftWeekly({
    title,
    notes,
    setValue,
    setNotes,
  });

  // useSetNotificationWeekly hook to set notification
  const { setNotification } = useSetNotificationWeekly({
    notifyAt: notifyAt!,
    title,
    notes,
    weekdays,
    mode,
  });

  // useSaveReminderWeekly hook to save weekly reminder
  const { saveReminder } = useSaveReminderWeekly({
    title,
    notes,
    notifyAt: notifyAt!,
    weekdays,
    mode,
    setIsSaving,
    setNotification,
    resetReminder,
  });

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <PageContainer>
          <View className="justify-between flex-1">
            <View className="gap-5">
              <AppText className="text-xl text-center">
                {t("reminders.weeklyReminders")}
              </AppText>
              <View className="flex-row items-center justify-center">
                <Info color="#9ca3af" size={18} />
                <AppText className="text-gray-400 text-sm ml-2">
                  {t("reminders.weeklyInfo")}
                </AppText>
              </View>
              <View>
                <AppInput
                  value={title}
                  setValue={setValue}
                  placeholder={t("reminders.titlePlaceholder")}
                  label={t("reminders.titleLabel")}
                />
              </View>
              <SubNotesInput
                value={notes}
                setValue={setNotes}
                placeholder={t("reminders.notesPlaceholder")}
                label={t("reminders.notesLabel")}
              />
              <View>
                <AnimatedButton
                  label={
                    notifyAt ? formattedTime : t("reminders.setNotifyTime")
                  }
                  onPress={() => setOpen(true)}
                  className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 flex-row gap-2 justify-center items-center"
                  textClassName="text-gray-100"
                >
                  <Plus color="#f3f4f6" />
                </AnimatedButton>
              </View>
              <DatePicker
                date={notifyAt || new Date()}
                onDateChange={setNotifyAt}
                mode="time"
                modal
                open={open}
                locale={i18n.language}
                title={t("common:datePicker.selectTime")}
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

              <View className="flex-row items-center justify-between px-4 mt-5">
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
                      setShowModal(true);
                      return;
                    }

                    setMode(mode === "alarm" ? "normal" : "alarm");
                  }}
                />
              </View>
            </View>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <DeleteButton onPress={resetReminder} />
              </View>
              <View className="flex-1">
                <SaveButton onPress={saveReminder} />
              </View>
            </View>
          </View>
          <FullScreenLoader
            visible={isSaving}
            message={t("reminders.savingReminder")}
          />
        </PageContainer>
      </TouchableWithoutFeedback>

      <InfoModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={t("reminders.alarmPermission.title")}
        description={t("reminders.alarmPermission.description")}
        cancelLabel={t("reminders.alarmPermission.cancel")}
        confirmLabel={t("reminders.alarmPermission.allow")}
        onConfirm={async () => {
          await requestExactAlarm();
          setShowModal(false);
        }}
      />
    </>
  );
}
