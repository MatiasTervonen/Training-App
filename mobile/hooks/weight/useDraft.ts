import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";
import { formatDate } from "@/lib/formatDate";

export default function useWeightDraft({
  title,
  notes,
  weight,
  setTitle,
  setNotes,
  setWeight,
  setIsLoaded,
  isLoaded,
}: {
  title: string;
  notes: string;
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setWeight: (weight: string) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  isLoaded: boolean;
  weight: string;
}) {
  const now = formatDate(new Date());

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("weight_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setTitle(draft.title || `Weight - ${now}`);
          setNotes(draft.notes || "");
          setWeight(draft.weight || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading weight draft",
          route: "weight/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadDraft();
  }, [now, setTitle, setNotes, setWeight, setIsLoaded]);

  const saveWeightDraft = useDebouncedCallback(
    async () => {
      if (title.trim().length === 0 && notes.trim().length === 0) {
        await AsyncStorage.removeItem("weight_draft");
      } else {
        const draft = { title, notes, weight };
        await AsyncStorage.setItem("weight_draft", JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    if (!isLoaded) return;
    saveWeightDraft();
  }, [notes, title, weight, saveWeightDraft, isLoaded]);

  return {
    saveWeightDraft,
  };
}
