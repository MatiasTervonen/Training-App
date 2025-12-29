import { useDebouncedCallback } from "use-debounce";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleError } from "@/utils/handleError";

export default function useSaveDraftWeekly({
  title,
  notes,
  setValue,
  setNotes,
}: {
  title: string;
  notes: string;
  setValue: (value: string) => void;
  setNotes: (notes: string) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("weekly_reminder_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setValue(draft.title || "");
          setNotes(draft.notes || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading weekly reminder draft",
          route: "reminders/weekly-reminder/index.tsx",
          method: "loadDraftWeekly",
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadDraft();
  }, [setIsLoaded, setValue, setNotes]);

  const saveDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;

      if (notes.trim().length === 0 && title.trim().length === 0) {
        await AsyncStorage.removeItem("weekly_reminder_draft");
      } else {
        const sessionDraft = {
          title: title,
          notes,
        };
        await AsyncStorage.setItem(
          "weekly_reminder_draft",
          JSON.stringify(sessionDraft)
        );
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    saveDraft();
  }, [notes, title, saveDraft]);
  return {
    saveDraft,
  };
}
