import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";

export default function useSaveDraft({
  title,
  notes,
  allowGPS,
  setTitle,
  setNotes,
  setAllowGPS,
  setActivityName,
  setIsLoaded,
  isLoaded,
}: {
  title: string;
  notes: string;
  allowGPS: boolean;
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setAllowGPS: (allowGPS: boolean) => void;
  setActivityName: (activityName: string) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  isLoaded: boolean;
}) {
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("activity_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setTitle(draft.title || "");
          setNotes(draft.notes || "");
          setAllowGPS(draft.allowGPS);
          setActivityName(draft.activityName || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading activity draft",
          route: "activities/start-activity/index.tsx",
          method: "loadActivityDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };
    loadDraft();
  }, [setTitle, setNotes, setAllowGPS, setActivityName, setIsLoaded]);

  const saveActivityDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;

      const draft = { title, notes, allowGPS };
      await AsyncStorage.mergeItem("activity_draft", JSON.stringify(draft));
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    saveActivityDraft();
  }, [notes, title, allowGPS, saveActivityDraft]);

  return {
    saveActivityDraft,
  };
}
