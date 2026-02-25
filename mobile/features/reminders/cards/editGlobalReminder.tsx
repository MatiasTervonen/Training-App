import { useState, useEffect } from "react";
import SubNotesInput from "@/components/SubNotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
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
import { canUseExactAlarm, requestExactAlarm } from "@/native/android/EnsureExactAlarmPermission";
import InfoModal from "@/components/InfoModal";
import useSetNotification from "@/features/reminders/hooks/global/useSetNotification";
import { Dot } from "lucide-react-native";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation("common");
  const queryClient = useQueryClient();
  const payload = reminder.extra_fields as unknown as reminderPayload;

  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(payload.notes);
  const [isSaving, setIsSaving] = useState(false);
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

  const originalNotifyAt = payload.notify_at ? new Date(payload.notify_at).getTime() : null;
  const currentNotifyAt = notifyAt ? notifyAt.getTime() : null;
  const hasChanges =
    title !== reminder.title ||
    notes !== payload.notes ||
    currentNotifyAt !== originalNotifyAt ||
    mode !== (payload.mode || "normal");

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const formattedNotifyAt = formatDateTime(notifyAt!);

  const handleSubmit = async () => {
    if (title.trim().length === 0) {
      Toast.show({
        type: "error",
        text1: "Title is required",
      });
      return;
    }

    if (!notifyAt) {
      Toast.show({
        type: "error",
        text1: "Notify time is required",
      });
      return;
    }

    if (notifyAt < new Date()) {
      Toast.show({
        type: "error",
        text1: "Notify time must be in the future.",
      });
      return;
    }

    const delivered =
      notifyAt && notifyAt.getTime() > Date.now() ? false : payload.delivered;

    const updated = new Date().toISOString();

    setIsSaving(true);

    try {
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

      // Schedule notification/alarm if time changed to future
      if (notifyAt && notifyAt.getTime() > Date.now()) {
        await setNotification(reminder.source_id);
      }

      onSave({ ...updatedFeedItem, feed_context: reminder.feed_context });
      onClose();
      queryClient.invalidateQueries({ queryKey: ["feed"], exact: true });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    } catch {
      Toast.show({
        type: "error",
        text1: "Error editing global reminder",
        text2: "Try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {hasChanges && (
        <View className="bg-gray-900 absolute top-5 left-5 z-50 py-1 px-4 flex-row items-center rounded-lg">
          <AppText className="text-sm text-yellow-500">{t("common.unsavedChanges")}</AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <PageContainer className="justify-between mb-5">
          <View>
            <AppText className=" text-xl text-center mb-10 mt-5">
              Edit your reminder
            </AppText>
            <View className="mb-5">
              <AppInput
                value={title || ""}
                onChangeText={setValue}
                placeholder="Reminder title..."
                label="Title..."
              />
            </View>
            <SubNotesInput
              value={notes || ""}
              setValue={setNotes}
              placeholder="Notes... (optional)"
              label="Notes..."
            />
            <View>
              <AnimatedButton
                label={notifyAt ? formattedNotifyAt : "Set Notify Time"}
                onPress={() => setOpen(true)}
                className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 flex-row gap-2 justify-center items-center mt-10"
                textClassName="text-gray-100"
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
              title={t("datePicker.selectDateTime")}
              confirmText={t("datePicker.confirm")}
              cancelText={t("datePicker.cancel")}
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
                <AppText>Enable high priority reminder</AppText>
                <AppText className="text-gray-400 text-sm">
                  (Continue to alarm until dismissed)
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
          <View className="pt-10">
            <SaveButton onPress={handleSubmit} />
          </View>
          <FullScreenLoader visible={isSaving} message="Saving reminder..." />
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
