import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

export default function useSaveDraft({
  title,
  notes,
  draftRecordings,
  setTitle,
  setNotes,
  setDraftRecordings,
}: {
  title: string;
  notes: string;
  draftRecordings: DraftRecording[];
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setDraftRecordings: (recordings: DraftRecording[]) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("notes_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setTitle(draft.title || "");
          setNotes(draft.notes || "");
          setDraftRecordings(draft.draftRecordings || []);
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
  }, [setIsLoaded, setTitle, setNotes, setDraftRecordings]);

  const saveNotesDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;

      if (title.trim().length === 0 && notes.trim().length === 0) {
        await AsyncStorage.removeItem("notes_draft");
      } else {
        const draft = { title, notes, draftRecordings };
        await AsyncStorage.setItem("notes_draft", JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 },
  );

  useEffect(() => {
    saveNotesDraft();
  }, [notes, title, draftRecordings, saveNotesDraft]);

  return {
    saveNotesDraft,
  };
}
