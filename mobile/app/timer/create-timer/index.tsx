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
import useSaveDraft from "@/features/timer/hooks/useSaveDraft";
import useSaveTimer from "@/features/timer/hooks/useSaveTimer";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
  const { t } = useTranslation("timer");
  const [title, setTitle] = useState("");
  const [alarmMinutes, setAlarmMinutes] = useState("");
  const [alarmSeconds, setAlarmSeconds] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");

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
          <AppText className="text-2xl text-center mb-5">
            {t("timer.createTimer")}
          </AppText>
          <AppInput
            label={t("timer.titleLabel")}
            value={title}
            setValue={setTitle}
            placeholder={t("timer.titlePlaceholder")}
          />
          <SubNotesInput
            label={t("timer.notesLabel")}
            value={notes}
            setValue={setNotes}
            placeholder={t("timer.notesPlaceholder")}
          />
          <View className="flex-row gap-2 mb-4 w-full">
            <View className="flex-1">
              <NumberInput
                label={t("timer.minutes")}
                value={alarmMinutes}
                onChangeText={setAlarmMinutes}
                placeholder={t("timer.minutes")}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <NumberInput
                label={t("timer.seconds")}
                value={alarmSeconds}
                onChangeText={setAlarmSeconds}
                placeholder={t("timer.seconds")}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <DeleteButton onPress={handleReset} />
          </View>
          <View className="flex-1">
            <SaveButton onPress={handleSaveTimer} />
          </View>
        </View>
        <FullScreenLoader visible={isSaving} message={t("timer.savingTimer")} />
      </PageContainer>
    </TouchableWithoutFeedback>
  );
}
