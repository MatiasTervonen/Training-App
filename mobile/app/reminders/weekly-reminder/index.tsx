import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import AppInput from "@/components/AppInput";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageContainer from "@/components/PageContainer";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus, Info } from "lucide-react-native";
import { formatTime } from "@/lib/formatDate";
import { Checkbox } from "expo-checkbox";
import SubNotesInput from "@/components/SubNotesInput";
import useSaveDraftWeekly from "@/Features/reminders/hooks/weekly/useSaveDraft";
import useSaveReminderWeekly from "@/Features/reminders/hooks/weekly/useSaveReminder";
import useSetNotificationWeekly from "@/Features/reminders/hooks/weekly/useSetNotification";

export default function ReminderScreen() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [weekdays, setWeekdays] = useState<number[]>([]);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formattedTime = formatTime(notifyAt!);

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
  });

  // useSaveReminderWeekly hook to save weekly reminder
  const { saveReminder } = useSaveReminderWeekly({
    title,
    notes,
    notifyAt: notifyAt!,
    weekdays,
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
                Weekly reminders
              </AppText>
              <View className="flex-row items-center justify-center">
                <Info color="#9ca3af" size={18} />
                <AppText className="text-gray-400 text-sm ml-2">
                  Repeats on selected days each week.
                </AppText>
              </View>
              <View>
                <AppInput
                  value={title}
                  setValue={setValue}
                  placeholder="Title... (required)"
                  label="Title..."
                />
              </View>
              <SubNotesInput
                value={notes}
                setValue={setNotes}
                className="min-h-[60px]"
                placeholder="Notes... (optional)"
                label="Notes..."
              />
              <View>
                <AnimatedButton
                  label={notifyAt ? formattedTime : "Set Notify Time"}
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
            </View>
            <View className="gap-5">
              <SaveButton onPress={saveReminder} />
              <DeleteButton onPress={resetReminder} />
            </View>
          </View>
          <FullScreenLoader visible={isSaving} message="Saving reminder..." />
        </PageContainer>
      </TouchableWithoutFeedback>
    </>
  );
}
