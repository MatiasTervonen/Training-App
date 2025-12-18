import { useState } from "react";
import SubNotesInput from "../SubNotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import AppText from "../AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import EditGlobalReminder from "@/database/reminders/edit-global-reminder";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus } from "lucide-react-native";
import { formatDateTime } from "@/lib/formatDate";
import PageContainer from "../PageContainer";
import { full_reminder } from "@/types/session";

type Props = {
  reminder: full_reminder;
  onClose: () => void;
  onSave?: () => void;
};

export default function HandleEditGlobalReminder({
  reminder,
  onClose,
  onSave,
}: Props) {
  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(reminder.notes);
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState(
    reminder.notify_at ? new Date(reminder.notify_at) : null
  );
  const [open, setOpen] = useState(false);

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
      notifyAt && notifyAt.getTime() > Date.now() ? false : reminder.delivered;

    const updated = new Date().toISOString();

    setIsSaving(true);
    try {
      await EditGlobalReminder({
        id: reminder.id,
        title,
        notes,
        delivered,
        notify_at: notifyAt ? notifyAt.toISOString() : null,
        updated_at: updated,
        seen_at: null,
      });

      await onSave?.();
      onClose();
    } catch {
      Toast.show({
        type: "error",
        text1: "Error editing global reminder",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
        </View>
        <View className="pt-10">
          <SaveButton onPress={handleSubmit} />
        </View>
        <FullScreenLoader visible={isSaving} message="Saving reminder..." />
      </PageContainer>
    </TouchableWithoutFeedback>
  );
}
