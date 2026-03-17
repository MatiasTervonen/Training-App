import { View, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import SaveButton from "@/components/buttons/SaveButton";
import { useCallback, useState } from "react";
import AppInput from "@/components/AppInput";
import PageContainer from "@/components/PageContainer";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SubNotesInput from "@/components/SubNotesInput";
import { TimerPicker } from "react-native-timer-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import useSaveDraft from "@/features/timer/hooks/useSaveDraft";
import useSaveTimer from "@/features/timer/hooks/useSaveTimer";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
  const { t } = useTranslation("timer");
  const [title, setTitle] = useState("");
  const [pickerDuration, setPickerDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");

  const durationInSeconds =
    pickerDuration.hours * 3600 + pickerDuration.minutes * 60 + pickerDuration.seconds;

  const handleReset = () => {
    AsyncStorage.removeItem("activeSession");
    AsyncStorage.removeItem("timer:timer");
    AsyncStorage.removeItem("timer_session_draft");
    setTitle("");
    setPickerDuration({ hours: 0, minutes: 0, seconds: 0 });
    setNotes("");
  };

  const stableSetPickerDuration = useCallback(
    (d: { hours: number; minutes: number; seconds: number }) => setPickerDuration(d),
    [],
  );

  useSaveDraft({
    title,
    notes,
    durationInSeconds,
    setTitle,
    setNotes,
    setPickerDuration: stableSetPickerDuration,
  });

  const { handleSaveTimer } = useSaveTimer({
    title,
    notes,
    setIsSaving,
    durationInSeconds,
    handleReset,
  });

  return (
    <View className="flex-1" onTouchStart={Keyboard.dismiss}>
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
          <View className="items-center bg-slate-800/60 rounded-2xl border border-slate-700/50 py-4 px-2" onTouchStart={(e) => e.stopPropagation()}>
            <TimerPicker
              onDurationChange={setPickerDuration}
              LinearGradient={LinearGradient}
              padWithNItems={2}
              hourLabel={t("timer.h")}
              minuteLabel={t("timer.m")}
              secondLabel={t("timer.s")}
              pickerFeedback={() => Haptics.selectionAsync()}
              styles={{
                theme: "dark",
                backgroundColor: "transparent",
                pickerItem: {
                  fontSize: 28,
                  color: "#94a3b8",
                },
                selectedPickerItem: {
                  fontSize: 34,
                  color: "#f1f5f9",
                },
                pickerLabel: {
                  fontSize: 14,
                  color: "#64748b",
                  marginTop: 0,
                },
                pickerContainer: {
                  marginRight: 6,
                },
              }}
            />
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
    </View>
  );
}
