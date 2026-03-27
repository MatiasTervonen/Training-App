import { View, AppState } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
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
import { formatDateTime } from "@/lib/formatDate";
import SubNotesInput from "@/components/SubNotesInput";
import useSaveDraft from "@/features/reminders/hooks/global/useSaveDraft";
import useSaveReminder from "@/features/reminders/hooks/global/useSaveReminder";
import useSetNotification from "@/features/reminders/hooks/global/useSetNotification";
import Toggle from "@/components/toggle";
import { canUseExactAlarm, requestExactAlarm } from "@/native/android/EnsureExactAlarmPermission";
import InfoModal from "@/components/InfoModal";
import { useTranslation } from "react-i18next";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";

export default function ReminderScreen() {
  const { t, i18n } = useTranslation("reminders");
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [mode, setMode] = useState<"alarm" | "normal">("normal");
  const [showModal, setShowModal] = useState(false);

  const formattedTime = formatDateTime(notifyAt!);

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
    AsyncStorage.removeItem("global_reminder_draft");
    setValue("");
    setNotes("");
    setNotifyAt(null);
  };

  // useSaveDraft hook to save draft reminder
  useSaveDraft({
    title,
    notes,
    setValue,
    setNotes,
  });

  // useSetNotification hook to set local notification
  const { setNotification } = useSetNotification({
    notifyAt: notifyAt!,
    title,
    notes,
    mode,
  });

  // useSaveReminder hook to save reminder
  const { saveReminder } = useSaveReminder({
    title,
    notes,
    notifyAt: notifyAt!,
    mode,
    setIsSaving,
    resetReminder,
    setNotification,
  });

  return (
    <View className="flex-1">
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} bottomOffset={50} showsVerticalScrollIndicator={false}>
        <PageContainer className="justify-between">
          <View>
            <AppText className="text-xl text-center mb-2">
              {t("reminders.globalReminder")}
            </AppText>
            <View className="flex-row items-center justify-center mb-5">
              <Info color="#9ca3af" size={18} />
              <BodyTextNC className="text-gray-400 text-sm ml-2 shrink">
                {t("reminders.globalInfo")}
              </BodyTextNC>
            </View>
            <View className="gap-5">
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
                className="btn-base flex-row gap-2 justify-center items-center"
              >
                <Plus color="#f3f4f6" />
              </AnimatedButton>
            </View>
            <DatePicker
              date={notifyAt || new Date()}
              onDateChange={setNotifyAt}
              mode="datetime"
              modal
              minimumDate={new Date()}
              open={open}
              locale={i18n.language}
              title={t("common:datePicker.selectDateTime")}
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
                <BodyText className="text-gray-200">{t("reminders.enableHighPriority")}</BodyText>
                <BodyText className="text-gray-400 text-sm">
                  {t("reminders.highPriorityDescription")}
                </BodyText>
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
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <DeleteButton onPress={resetReminder} />
            </View>
            <View className="flex-1">
              <SaveButton onPress={saveReminder} />
            </View>
          </View>
        </PageContainer>
      </KeyboardAwareScrollView>
      <FullScreenLoader
        visible={isSaving}
        message={t("reminders.savingReminder")}
      />
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
    </View>
  );
}
