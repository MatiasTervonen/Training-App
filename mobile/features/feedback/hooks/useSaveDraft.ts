import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";

export default function useSaveDraft({
  category,
  title,
  message,
  setCategory,
  setTitle,
  setMessage,
}: {
  category: string;
  title: string;
  message: string;
  setCategory: (category: string) => void;
  setTitle: (title: string) => void;
  setMessage: (message: string) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("feedback_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setCategory(draft.category || "general");
          setTitle(draft.title || "");
          setMessage(draft.message || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading feedback draft",
          route: "menu/feedback/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };
    loadDraft();
  }, [setCategory, setTitle, setMessage, setIsLoaded]);

  const saveDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;

      if (title.trim().length === 0 && message.trim().length === 0) {
        await AsyncStorage.removeItem("feedback_draft");
      } else {
        const draft = { category, title, message };
        await AsyncStorage.setItem("feedback_draft", JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 },
  );

  useEffect(() => {
    saveDraft();
  }, [category, title, message, saveDraft]);

  const clearDraft = async () => {
    await AsyncStorage.removeItem("feedback_draft");
  };

  return { clearDraft };
}
