import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";
import { DraftRecording, DraftVideo } from "@/types/session";

type DraftImage = {
  id: string;
  uri: string;
};

export default function useSaveDraft({
  title,
  notes,
  draftRecordings,
  draftImages = [],
  draftVideos = [],
  setTitle,
  setNotes,
  setDraftRecordings,
  setDraftImages,
  setDraftVideos,
}: {
  title: string;
  notes: string;
  draftRecordings: DraftRecording[];
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setDraftRecordings: (recordings: DraftRecording[]) => void;
  setDraftImages?: (images: DraftImage[]) => void;
  setDraftVideos?: (videos: DraftVideo[]) => void;
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
          setDraftImages?.(draft.draftImages || []);
          setDraftVideos?.(draft.draftVideos || []);
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
        const draft = { title, notes, draftRecordings, draftImages, draftVideos };
        await AsyncStorage.setItem("notes_draft", JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 },
  );

  useEffect(() => {
    saveNotesDraft();
  }, [notes, title, draftRecordings, draftImages, draftVideos, saveNotesDraft]);

  return {
    saveNotesDraft,
  };
}
