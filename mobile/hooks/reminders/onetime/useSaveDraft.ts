import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";

export default function useSaveDraftOnetime({
  title,
  notes,
  setValue,
  setNotes,
  setIsLoaded,
  isLoaded,
}: {
  title: string;
  notes: string;
  setValue: (value: string) => void;
  setNotes: (notes: string) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  isLoaded: boolean;
}) {
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("onetime_reminder_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setValue(draft.title || "");
          setNotes(draft.notes || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading reminder draft",
          route: "reminders/onetime-reminder/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadDraft();
  }, [setIsLoaded, setValue, setNotes]);

  const saveDraft = useDebouncedCallback(
    async () => {
      if (notes.trim().length === 0 && title.trim().length === 0) {
        await AsyncStorage.removeItem("onetime_reminder_draft");
      } else {
        const sessionDraft = {
          title: title,
          notes,
        };
        await AsyncStorage.setItem(
          "onetime_reminder_draft",
          JSON.stringify(sessionDraft)
        );
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    if (!isLoaded) return;
    saveDraft();
  }, [notes, title, saveDraft, isLoaded]);
  return {
    saveDraft,
  };
}
