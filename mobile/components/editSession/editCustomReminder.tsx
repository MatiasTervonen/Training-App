import { useState } from "react";
import SubNotesInput from "../SubNotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import AppText from "../AppText";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus } from "lucide-react-native";
import { formatDateTime, formatTime } from "@/lib/formatDate";
import PageContainer from "../PageContainer";
import { Checkbox } from "expo-checkbox";
import { full_reminder } from "@/types/session";
import useSaveReminder from "@/hooks/reminders/edit-reminder/useSaveReminder";
import useSetNotification from "@/hooks/reminders/edit-reminder/useSetNotification";

type Props = {
  reminder: full_reminder;
  onClose: () => void;
  onSave: () => void;
};

export default function EditCustomReminder({
  reminder,
  onClose,
  onSave,
}: Props) {
  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(reminder.notes);
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date>(() => {
    if (reminder.notify_date) {
      return new Date(reminder.notify_date);
    }

    if (reminder.notify_at_time) {
      const base = new Date();
      const [h, m, s] = reminder.notify_at_time.split(":").map(Number);
      base.setHours(h, m, s || 0, 0);
      return base;
    }

    return new Date();
  });
  const [open, setOpen] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>(reminder.weekdays || []);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formattedNotifyAt =
    reminder.type === "one-time"
      ? formatDateTime(notifyAt!)
      : formatTime(notifyAt!);

  const { scheduleNotifications } = useSetNotification({
    notifyAt,
    title,
    notes: notes || "",
    reminder,
    weekdays,
  });
  
  const { handleSave } = useSaveReminder({
    title,
    notes: notes || "",
    notifyAt,
    setIsSaving,
    reminder,
    onSave,
    onClose,
    scheduleNotifications,
    weekdays,
  });

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
            date={notifyAt}
            onDateChange={setNotifyAt}
            mode={reminder.type === "one-time" ? "datetime" : "time"}
            modal
            minimumDate={reminder.type === "one-time" ? new Date() : undefined}
            open={open}
            onConfirm={(date) => {
              setOpen(false);
              setNotifyAt(date);
            }}
            onCancel={() => {
              setOpen(false);
            }}
          />
          {reminder.type === "weekly" && (
            <View className="mt-5">
              <View className="flex-row gap-6">
                <AppText>Repeat on these days:</AppText>
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
                              weekdays.filter((day) => day !== dayNumber)
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
        </View>
        <View className="pt-10">
          <SaveButton onPress={handleSave} />
        </View>
        <FullScreenLoader visible={isSaving} message="Saving reminder..." />
      </PageContainer>
    </TouchableWithoutFeedback>
  );
}
