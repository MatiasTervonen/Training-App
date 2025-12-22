import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";

export default function useSaveDraft({
  title,
  notes,
  setTitle,
  setNotes,
  setAlarmMinutes,
  setAlarmSeconds,
  alarmMinutes,
  alarmSeconds,
}: {
  title: string;
  notes: string;
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setAlarmMinutes: (alarmMinutes: string) => void;
  setAlarmSeconds: (alarmSeconds: string) => void;
  alarmMinutes: string;
  alarmSeconds: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  
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
  }, [setIsLoaded, setTitle, setNotes, setAlarmMinutes, setAlarmSeconds]);

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

  return {
    saveTimerDraft,
  };
}
