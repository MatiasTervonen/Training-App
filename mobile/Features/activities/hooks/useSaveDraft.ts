import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";

export default function useSaveDraft({
  title,
  notes,
  setTitle,
  setNotes,
  setActivityName,
}: {
  title: string;
  notes: string;
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setActivityName: (activityName: string) => void;
}) {
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("activity_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setTitle(draft.title || "");
          setNotes(draft.notes || "");
          setActivityName(draft.activityName || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading activity draft",
          route: "activities/start-activity/index.tsx",
          method: "loadActivityDraft",
        });
      }
    };
    loadDraft();
  }, [setTitle, setNotes, setActivityName]);

  const saveActivityDraft = useDebouncedCallback(
    async () => {
      const draft = { title, notes };
      await AsyncStorage.mergeItem("activity_draft", JSON.stringify(draft));
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    saveActivityDraft();
  }, [notes, title, saveActivityDraft]);

  return {
    saveActivityDraft,
  };
}
