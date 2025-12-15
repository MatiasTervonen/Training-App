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
import SubNotesInput from "@/components/SubNotesInput";
import useSaveDraftDaily from "@/hooks/reminders/daily/useSaveDraftDaily";
import useSaveReminderDaily from "@/hooks/reminders/daily/useSaveReminderDaily";
import useSetNotification from "@/hooks/reminders/daily/useSetNotification";

export default function ReminderScreen() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const formattedTime = formatTime(notifyAt!);

  const resetReminder = () => {
    AsyncStorage.removeItem("reminder_draft");
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
    setIsLoaded,
    isLoaded,
  });

  // useSetNotification hook to set notification
  const { setNotification } = useSetNotification({
    notifyAt: notifyAt || new Date(),
    title,
    notes,
  });

  // useSaveReminderDaily hook to save daily reminder
  const { saveReminder } = useSaveReminderDaily({
    title,
    notes,
    notifyAt: notifyAt || new Date(),
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
              <AppText className="text-xl text-center">Daily reminder</AppText>
              <View className="flex-row items-center justify-center">
                <Info color="#9ca3af" size={18} />
                <AppText className="text-gray-400 text-sm ml-2">
                  Repeats every day at the selected time.
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
