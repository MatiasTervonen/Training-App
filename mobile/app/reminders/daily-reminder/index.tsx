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
import SubNotesInput from "@/components/SubNotesInput";
import useSaveDraftDaily from "@/features/reminders/hooks/daily/useSaveDraftDaily";
import useSaveReminderDaily from "@/features/reminders/hooks/daily/useSaveReminderDaily";
import useSetNotification from "@/features/reminders/hooks/daily/useSetNotification";
import Toggle from "@/components/toggle";
import { canUseExactAlarm } from "@/native/android/EnsureExactAlarmPermission";
import ExactAlarmPermissionModal from "@/components/ExactAlarmPermissionModal";
import { useTranslation } from "react-i18next";

export default function ReminderScreen() {
  const { t, i18n } = useTranslation("reminders");
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [mode, setMode] = useState<"alarm" | "normal">("normal");
  const [showModal, setShowModal] = useState(false);

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
    AsyncStorage.removeItem("daily_reminder_draft");
    setValue("");
    setNotes("");
    setNotifyAt(null);
  };

  // useSaveDraftDaily hook to save draft daily reminder
  useSaveDraftDaily({
    title,
    notes,
    setValue,
    setNotes,
  });

  // useSetNotification hook to set notification
  const { setNotification } = useSetNotification({
    notifyAt: notifyAt!,
    title,
    notes,
    mode,
  });

  // useSaveReminderDaily hook to save daily reminder
  const { saveReminder } = useSaveReminderDaily({
    title,
    notes,
    notifyAt: notifyAt!,
    setIsSaving,
    setNotification,
    resetReminder,
    mode,
  });

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <PageContainer>
          <View className="justify-between flex-1">
            <View className="gap-5">
              <AppText className="text-xl text-center">
                {t("reminders.dailyReminder")}
              </AppText>
              <View className="flex-row items-center justify-center">
                <Info color="#9ca3af" size={18} />
                <AppText className="text-gray-400 text-sm ml-2">
                  {t("reminders.dailyInfo")}
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
            <View className="gap-5">
              <SaveButton onPress={saveReminder} />
              <DeleteButton onPress={resetReminder} />
            </View>
          </View>
          <FullScreenLoader
            visible={isSaving}
            message={t("reminders.savingReminder")}
          />
        </PageContainer>
      </TouchableWithoutFeedback>

      <ExactAlarmPermissionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
