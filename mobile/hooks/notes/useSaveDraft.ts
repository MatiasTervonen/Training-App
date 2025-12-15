import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";

export default function useSaveDraft({
  title,
  notes,
  setTitle,
  setNotes,
  setIsLoaded,
  isLoaded,
}: {
  title: string;
  notes: string;
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  isLoaded: boolean;
}) {
    
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("notes_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setTitle(draft.title || "");
          setNotes(draft.notes || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading notes draft",
          route: "notes/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };
    loadDraft();
  }, [setIsLoaded, setTitle, setNotes]);

  const saveNotesDraft = useDebouncedCallback(
    async () => {
      if (title.trim().length === 0 && notes.trim().length === 0) {
        await AsyncStorage.removeItem("notes_draft");
      } else {
        const draft = { title, notes };
        await AsyncStorage.setItem("notes_draft", JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    if (!isLoaded) return;
    saveNotesDraft();
  }, [notes, title, saveNotesDraft, isLoaded]);

  return {
    saveNotesDraft,
  };
}
