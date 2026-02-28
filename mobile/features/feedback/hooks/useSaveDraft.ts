import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";

export default function useSaveDraft({
  category,
  title,
  message,
  imageUris,
  setCategory,
  setTitle,
  setMessage,
  setImageUris,
}: {
  category: string;
  title: string;
  message: string;
  imageUris: string[];
  setCategory: (category: string) => void;
  setTitle: (title: string) => void;
  setMessage: (message: string) => void;
  setImageUris: (uris: string[]) => void;
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
          setImageUris(draft.imageUris || []);
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
  }, [setCategory, setTitle, setMessage, setImageUris, setIsLoaded]);

  const saveDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;

      if (
        title.trim().length === 0 &&
        message.trim().length === 0 &&
        imageUris.length === 0
      ) {
        await AsyncStorage.removeItem("feedback_draft");
      } else {
        const draft = { category, title, message, imageUris };
        await AsyncStorage.setItem("feedback_draft", JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 },
  );

  useEffect(() => {
    saveDraft();
  }, [category, title, message, imageUris, saveDraft]);

  const clearDraft = async () => {
    await AsyncStorage.removeItem("feedback_draft");
  };

  return { clearDraft };
}
