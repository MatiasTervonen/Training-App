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
  meters,
  setMeters,
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
  meters: number;
  setMeters: (meters: number) => void;
}) {
  useEffect(() => {
    const loadDraft = async () => {
      try {
        console.log("loadDraft");
        const storeDraft = await AsyncStorage.getItem("activity_draft");
        if (storeDraft) {
          console.log("storeDraft", JSON.parse(storeDraft));
          const draft = JSON.parse(storeDraft);
          setTitle(draft.title || "");
          setNotes(draft.notes || "");
          setAllowGPS(draft.allowGPS);
          setActivityName(draft.activityName || "");
          setMeters(draft.meters || 0);
        }
      } catch (error) {
        console.log("error", error);
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
  }, [
    setTitle,
    setNotes,
    setAllowGPS,
    setActivityName,
    setIsLoaded,
    setMeters,
  ]);

  const saveActivityDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;

      const draft = { title, notes, allowGPS, meters };
      await AsyncStorage.mergeItem("activity_draft", JSON.stringify(draft));
      console.log("saveActivityDraft", draft);
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    saveActivityDraft();
  }, [notes, title, allowGPS, meters, saveActivityDraft]);

  return {
    saveActivityDraft,
  };
}
