import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";

type PickerDuration = { hours: number; minutes: number; seconds: number };

export default function useSaveDraft({
  title,
  notes,
  durationInSeconds,
  setTitle,
  setNotes,
  setPickerDuration,
}: {
  title: string;
  notes: string;
  durationInSeconds: number;
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setPickerDuration: (d: PickerDuration) => void;
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
            const total = draft.durationInSeconds;
            setPickerDuration({
              hours: Math.floor(total / 3600),
              minutes: Math.floor((total % 3600) / 60),
              seconds: total % 60,
            });
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
  }, [setIsLoaded, setTitle, setNotes, setPickerDuration]);

  const saveTimerDraft = useDebouncedCallback(async () => {
    const draft = {
      title,
      notes,
      durationInSeconds,
    };
    await AsyncStorage.setItem("timer_session_draft", JSON.stringify(draft));
  }, 1000);

  useEffect(() => {
    if (!isLoaded) return;
    saveTimerDraft();
  }, [title, durationInSeconds, notes, isLoaded, saveTimerDraft]);

  return {
    saveTimerDraft,
  };
}
