import { useState } from "react";
import NotesInput from "@/components/NotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import { Feed_item } from "@/types/session";
import { handleError } from "@/utils/handleError";
import AppText from "../AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import EditReminderData from "@/api/reminders/edit-reminder";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/animatedButton";
import { Plus } from "lucide-react-native";
import { formatDateTime } from "@/lib/formatDate";

type Props = {
  reminder: Feed_item;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditReminder({ reminder, onClose, onSave }: Props) {
  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(reminder.notes);
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState(
    reminder.notify_at ? new Date(reminder.notify_at) : null
  );
  const [open, setOpen] = useState(false);

  const formattedNotifyAt = formatDateTime(notifyAt!);

  const handleSubmit = async () => {
    setIsSaving(true);

    let delivered = reminder.delivered;

    if (notifyAt?.toISOString() !== reminder.notify_at) {
      delivered = false;
    }

    try {
      await EditReminderData({
        id: reminder.id,
        title,
        notes,
        delivered,
        notify_at: notifyAt ? notifyAt.toISOString() : null,
      });

      await onSave?.();
      onClose();
    } catch (error) {
      console.error("Error editing notes:", error);
      handleError(error, {
        message: "Error editing notes",
        route: "/api/notes/edit-notes",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: "Error editing notes",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View className="w-full flex-1 px-6 my-10 justify-between">
        <View>
          <AppText className=" text-xl text-center my-5">
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
          <View className="min-h-[80px]">
            <NotesInput
              value={notes || ""}
              onChangeText={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
            />
          </View>
          <View>
            <AnimatedButton
              label={notifyAt ? formattedNotifyAt : "Set Notify Time"}
              onPress={() => setOpen(true)}
              className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 flex-row gap-2 justify-center items-center mt-10"
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
        <View className="py-10">
          <SaveButton onPress={handleSubmit} />
        </View>
        <FullScreenLoader visible={isSaving} message="Saving notes..." />
      </View>
    </TouchableWithoutFeedback>
  );
}
