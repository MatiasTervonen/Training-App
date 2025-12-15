import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import SaveButton from "@/components/buttons/SaveButton";
import { useState } from "react";
import AppInput from "@/components/AppInput";
import PageContainer from "@/components/PageContainer";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NumberInput from "@/components/NumberInput";
import SubNotesInput from "@/components/SubNotesInput";
import useSaveDraft from "@/hooks/timer/useSaveDraft";
import useSaveTimer from "@/hooks/timer/useSaveTimer";

export default function SettingsScreen() {
  const [title, setTitle] = useState("");
  const [alarmMinutes, setAlarmMinutes] = useState("");
  const [alarmSeconds, setAlarmSeconds] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const handleReset = () => {
    AsyncStorage.removeItem("activeSession");
    AsyncStorage.removeItem("timer:timer");
    AsyncStorage.removeItem("timer_session_draft");
    setTitle("");
    setAlarmMinutes("");
    setAlarmSeconds("");
    setNotes("");
  };

  // useSaveDraft hook to save draft timer
  useSaveDraft({
    title,
    notes,
    setTitle,
    setNotes,
    setIsLoaded,
    isLoaded,
    setAlarmMinutes,
    setAlarmSeconds,
    alarmMinutes,
    alarmSeconds,
  });

  // useSaveTimer hook to save timer
  const { handleSaveTimer } = useSaveTimer({
    title,
    notes,
    setIsSaving,
    alarmMinutes,
    alarmSeconds,
    handleReset,
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <PageContainer className="justify-between">
        <View className="gap-5">
          <AppText className="text-2xl text-center mb-5">Create Timer</AppText>
          <AppInput
            label="Title..."
            value={title}
            setValue={setTitle}
            placeholder="Timer Title"
          />
          <SubNotesInput
            label="Notes..."
            value={notes}
            setValue={setNotes}
            placeholder="Timer notes...(optional)"
            className="min-h-[60px]"
          />
          <View className="flex-row gap-2 mb-4 w-full">
            <View className="flex-1">
              <NumberInput
                label="Minutes"
                value={alarmMinutes}
                onChangeText={setAlarmMinutes}
                placeholder="Minutes"
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <NumberInput
                label="Seconds"
                value={alarmSeconds}
                onChangeText={setAlarmSeconds}
                placeholder="Seconds"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        <View className="gap-4">
          <SaveButton onPress={handleSaveTimer} />
          <DeleteButton onPress={handleReset} />
        </View>
        <FullScreenLoader visible={isSaving} message="Saving timer..." />
      </PageContainer>
    </TouchableWithoutFeedback>
  );
}
