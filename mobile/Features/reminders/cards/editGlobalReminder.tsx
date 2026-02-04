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
import Toggle from "@/components/toggle";
import { canUseExactAlarm } from "@/native/android/EnsureExactAlarmPermission";
import ExactAlarmPermissionModal from "@/components/ExactAlarmPermissionModal";
import useSetNotification from "@/features/reminders/hooks/global/useSetNotification";

type Props = {
  reminder: FeedItemUI;
  onClose: () => void;
  onSave: (updatedFeedItem: FeedItemUI) => void;
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
}: Props) {
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
        notify_at: notifyAt ? notifyAt.toISOString() : null,
        updated_at: updated,
        seen_at: null,
        mode,
      });

      // Schedule notification/alarm if time changed to future
      if (notifyAt && notifyAt.getTime() > Date.now()) {
        await setNotification(reminder.source_id);
      }

      onSave({ ...updatedFeedItem, feed_context: reminder.feed_context });
      onClose();
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
              className="min-h-[60px]"
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

      <ExactAlarmPermissionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
