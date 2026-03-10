import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";
import { formatDate } from "@/lib/formatDate";
import { DraftRecording, DraftImage, DraftVideo } from "@/types/session";

export default function useWeightDraft({
  title,
  notes,
  weight,
  draftRecordings,
  draftImages,
  draftVideos,
  setTitle,
  setNotes,
  setWeight,
  setDraftRecordings,
  setDraftImages,
  setDraftVideos,
}: {
  title: string;
  notes: string;
  weight: string;
  draftRecordings: DraftRecording[];
  draftImages: DraftImage[];
  draftVideos: DraftVideo[];
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setWeight: (weight: string) => void;
  setDraftRecordings: (recordings: DraftRecording[]) => void;
  setDraftImages: (images: DraftImage[]) => void;
  setDraftVideos: (videos: DraftVideo[]) => void;
}) {
  const now = formatDate(new Date());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("weight_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setTitle(draft.title || `Weight - ${now}`);
          setNotes(draft.notes || "");
          setWeight(draft.weight || "");
          setDraftRecordings(draft.draftRecordings || []);
          setDraftImages(draft.draftImages || []);
          const videos: DraftVideo[] = draft.draftVideos || [];
          setDraftVideos(videos.filter((v) => !v.isCompressing));
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
  }, [now, setTitle, setNotes, setWeight, setDraftRecordings, setDraftImages, setDraftVideos, setIsLoaded]);

  const saveWeightDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;

      if (title.trim().length === 0 && notes.trim().length === 0) {
        await AsyncStorage.removeItem("weight_draft");
      } else {
        const draft = {
          title,
          notes,
          weight,
          draftRecordings,
          draftImages,
          draftVideos: draftVideos.filter((v) => !v.isCompressing),
        };
        await AsyncStorage.setItem("weight_draft", JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    saveWeightDraft();
  }, [notes, title, weight, draftRecordings, draftImages, draftVideos, saveWeightDraft]);

  return {
    saveWeightDraft,
  };
}
