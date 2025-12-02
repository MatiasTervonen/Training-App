import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import { handleError } from "@/utils/handleError";
import AppText from "@/components/AppText";
import SaveButton from "@/components/buttons/SaveButton";
import Toast from "react-native-toast-message";
import { useState, useEffect } from "react";
import AppInput from "@/components/AppInput";
import PageContainer from "@/components/PageContainer";
import DeleteButton from "@/components/buttons/DeleteButton";
import saveTimer from "@/database/timer/save-timer";
import FullScreenLoader from "@/components/FullScreenLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useDebouncedCallback } from "use-debounce";
import NumberInput from "@/components/NumberInput";
import { useQueryClient } from "@tanstack/react-query";
import SubNotesInput from "@/components/SubNotesInput";

export default function SettingsScreen() {
  const [title, setTitle] = useState("");
  const [alarmMinutes, setAlarmMinutes] = useState("");
  const [alarmSeconds, setAlarmSeconds] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const router = useRouter();

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draftString = await AsyncStorage.getItem("timer_session_draft");
        if (draftString) {
          const draft = JSON.parse(draftString);
          setTitle(draft.title || "");
          setNotes(draft.notes || "");
          if (draft.durationInSeconds) {
            setAlarmMinutes(
              Math.floor(draft.durationInSeconds / 60).toString()
            );
            setAlarmSeconds((draft.durationInSeconds % 60).toString());
          }
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading timer draft",
          route: "timer/create-timer/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadDraft();
  }, []);

  const saveTimerDraft = useDebouncedCallback(async () => {
    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;
    const totalSeconds = minutes * 60 + seconds;
    const draft = {
      title,
      notes,
      durationInSeconds: totalSeconds,
    };
    await AsyncStorage.setItem("timer_session_draft", JSON.stringify(draft));
  }, 1000);

  useEffect(() => {
    if (!isLoaded) return;
    saveTimerDraft();
  }, [title, alarmMinutes, alarmSeconds, notes, isLoaded, saveTimerDraft]);

  const handleReset = () => {
    AsyncStorage.removeItem("activeSession");
    AsyncStorage.removeItem("timer:timer");
    AsyncStorage.removeItem("timer_session_draft");
    setTitle("");
    setAlarmMinutes("");
    setAlarmSeconds("");
    setNotes("");
  };

  const handleSaveTimer = async () => {
    if (!title || !alarmMinutes || !alarmSeconds) {
      Toast.show({
        type: "error",
        text1: "Please fill in all fields",
      });
      return;
    }

    setIsSaving(true);

    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;
    const totalSeconds = minutes * 60 + seconds;

    try {
      await saveTimer({
        title,
        durationInSeconds: totalSeconds,
        notes,
      });

      queryClient.refetchQueries({ queryKey: ["timers"], exact: true });
      router.push("/timer/my-timers");
      Toast.show({
        type: "success",
        text1: "Timer saved successfully",
      });
      handleReset();
    } catch {
      Toast.show({
        type: "error",
        text1: "Error saving timer",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
