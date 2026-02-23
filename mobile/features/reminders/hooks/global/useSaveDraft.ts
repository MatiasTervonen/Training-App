import { handleError } from "@/utils/handleError";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";

export default function useSaveDraft({
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
        const storeDraft = await AsyncStorage.getItem("global_reminder_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setValue(draft.title || "");
          setNotes(draft.notes || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading reminder draft",
          route: "reminders/index.tsx",
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
      if (!isLoaded) return;

      if (notes.trim().length === 0 && title.trim().length === 0) {
        await AsyncStorage.removeItem("global_reminder_draft");
      } else {
        const sessionDraft = {
          title,
          notes,
        };
        await AsyncStorage.setItem(
          "global_reminder_draft",
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
