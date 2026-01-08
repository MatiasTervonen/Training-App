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
import { formatDateTime } from "@/lib/formatDate";
import SubNotesInput from "@/components/SubNotesInput";
import useSaveDraftOnetime from "@/Features/reminders/hooks/onetime/useSaveDraft";
import useSaveReminderOnetime from "@/Features/reminders/hooks/onetime/useSaveReminder";
import useSetNotification from "@/Features/reminders/hooks/onetime/useSetNotification";
import Toggle from "@/components/toggle";
import { ensureExactAlarmPermission } from "@/native/android/EnsureExactAlarmPermission";

export default function ReminderScreen() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [mode, setMode] = useState<"alarm" | "normal">("normal");

  const formattedTime = formatDateTime(notifyAt!);

  const resetReminder = () => {
    AsyncStorage.removeItem("onetime_reminder_draft");
    setValue("");
    setNotes("");
    setNotifyAt(null);
  };

  // useSaveDraftOnetime hook to save draft reminder
  useSaveDraftOnetime({
    title,
    notes,
    setValue,
    setNotes,
  });

  // useSetNotificationOnetime hook to set notification
  const { setNotification } = useSetNotification({
    notifyAt: notifyAt!,
    title,
    notes,
    mode,
  });

  // useSaveReminderOnetime hook to save reminder
  const { saveReminder } = useSaveReminderOnetime({
    title,
    notes,
    notifyAt: notifyAt!,
    mode,
    setIsSaving,
    resetReminder,
    setNotification,
  });

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <PageContainer>
          <View className="justify-between flex-1">
            <View className="gap-5">
              <AppText className="text-xl text-center">
                One-Time Reminder
              </AppText>
              <View className="flex-row items-center justify-center">
                <Info color="#9ca3af" size={18} />
                <AppText className="text-gray-400 text-sm ml-2">
                  Notifies only this device once at the set time.
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
              <View className="flex-row items-center justify-between px-4 mt-5">
                <View>
                  <AppText>Enable high priority reminder</AppText>
                  <AppText className="text-gray-400 text-sm">
                    (Continue to alarm until dismissed)
                  </AppText>
                </View>
                <Toggle
                  isOn={mode === "alarm"}
                  onToggle={async () => {
                    const allowed = await ensureExactAlarmPermission();
                    if (!allowed) {
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
          <FullScreenLoader visible={isSaving} message="Saving reminder..." />
        </PageContainer>
      </TouchableWithoutFeedback>
    </>
  );
}
