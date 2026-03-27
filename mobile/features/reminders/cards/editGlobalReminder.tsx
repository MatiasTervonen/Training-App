import { useState, useEffect, useCallback, useMemo } from "react";
import SubNotesInput from "@/components/SubNotesInput";
import AppInput from "@/components/AppInput";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import AppText from "@/components/AppText";
import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  AppState,
} from "react-native";
import { editGlobalReminder } from "@/database/reminders/edit-global-reminder";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus } from "lucide-react-native";
import { formatDateTime } from "@/lib/formatDate";
import PageContainer from "@/components/PageContainer";
import { FeedItemUI } from "@/types/session";
import { useQueryClient } from "@tanstack/react-query";
import Toggle from "@/components/toggle";
import {
  canUseExactAlarm,
  requestExactAlarm,
} from "@/native/android/EnsureExactAlarmPermission";
import InfoModal from "@/components/InfoModal";
import useSetNotification from "@/features/reminders/hooks/global/useSetNotification";
import { useTranslation } from "react-i18next";
import BodyText from "@/components/BodyText";
import { useAutoSave } from "@/hooks/useAutoSave";

type Props = {
  reminder: FeedItemUI;
  onClose: () => void;
  onSave: (updatedFeedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

type reminderPayload = {
  notes: string;
  notify_at: Date;
  delivered: boolean;
  mode?: "alarm" | "normal";
};

export default function HandleEditGlobalReminder({
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
  const [notifyAt, setNotifyAt] = useState(
    payload.notify_at ? new Date(payload.notify_at) : null,
  );
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"alarm" | "normal">(
    payload.mode || "normal",
  );
  const [showModal, setShowModal] = useState(false);

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

  const { setNotification } = useSetNotification({
    notifyAt: notifyAt!,
    title,
    notes,
    mode,
  });

  const autoSaveData = useMemo(
    () => ({
      title,
      notes,
      notifyAtMs: notifyAt?.getTime() ?? null,
      mode,
    }),
    [title, notes, notifyAt, mode],
  );

  const handleAutoSave = useCallback(async () => {
    if (title.trim().length === 0 || !notifyAt || notifyAt < new Date()) {
      throw new Error("Validation failed");
    }

    const delivered =
      notifyAt && notifyAt.getTime() > Date.now() ? false : payload.delivered;

    const updated = new Date().toISOString();

    const updatedFeedItem = await editGlobalReminder({
      id: reminder.source_id,
      title,
      notes,
      delivered,
      notify_at: notifyAt.toISOString(),
      updated_at: updated,
      seen_at: updated,
      mode,
    });

    if (notifyAt && notifyAt.getTime() > Date.now()) {
      await setNotification(reminder.source_id);
    }

    onSave({ ...updatedFeedItem, feed_context: reminder.feed_context });
    queryClient.invalidateQueries({ queryKey: ["feed"], exact: true });
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
  }, [
    title,
    notes,
    notifyAt,
    mode,
    payload.delivered,
    reminder.source_id,
    reminder.feed_context,
    setNotification,
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

  const formattedNotifyAt = formatDateTime(notifyAt!);

  return (
    <>
      <AutoSaveIndicator status={status} />
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <PageContainer className="justify-between">
          <View>
            <AppText className="text-xl text-center mb-10">
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
              <AppText className="mt-5 mb-1 text-slate-300">
                {t("reminders.notifyTime")}
              </AppText>
              <AnimatedButton
                label={
                  notifyAt ? formattedNotifyAt : t("reminders.setNotifyTime")
                }
                onPress={() => setOpen(true)}
                className="btn-base flex-row gap-2 justify-center items-center"
              >
                <Plus color="#f3f4f6" />
              </AnimatedButton>
            </View>
            <DatePicker
              date={notifyAt ? new Date(notifyAt) : new Date()}
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
            <View className="flex-row items-center justify-between px-4 mt-10">
              <View>
                <BodyText>{t("reminders.enableHighPriority")}</BodyText>
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
