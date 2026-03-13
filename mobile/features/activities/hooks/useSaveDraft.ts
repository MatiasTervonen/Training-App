import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";
import { useTranslation } from "react-i18next";
import { DraftRecording, DraftImage, DraftVideo } from "@/types/session";

export default function useSaveDraft({
  title,
  notes,
  draftRecordings,
  draftImages,
  draftVideos,
  setTitle,
  setNotes,
  setActivityName,
  setDraftRecordings,
  setDraftImages,
  setDraftVideos,
  setBaseMet,
  setIsGpsRelevant,
  setIsStepRelevant,
  setIsCaloriesRelevant,
  setActivitySlug,
}: {
  title: string;
  notes: string;
  draftRecordings: DraftRecording[];
  draftImages: DraftImage[];
  draftVideos: DraftVideo[];
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setActivityName: (activityName: string) => void;
  setDraftRecordings: (recordings: DraftRecording[]) => void;
  setDraftImages: (images: DraftImage[]) => void;
  setDraftVideos: (videos: DraftVideo[]) => void;
  setBaseMet?: (baseMet: number) => void;
  setIsGpsRelevant?: (v: boolean) => void;
  setIsStepRelevant?: (v: boolean) => void;
  setIsCaloriesRelevant?: (v: boolean) => void;
  setActivitySlug?: (slug: string | null) => void;
}) {
  const { t } = useTranslation("activities");

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("activity_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setTitle(draft.title || "");
          setNotes(draft.notes || "");
          setDraftRecordings(draft.draftRecordings || []);
          setDraftImages(draft.draftImages || []);
          const videos: DraftVideo[] = draft.draftVideos || [];
          setDraftVideos(videos.filter((v) => !v.isCompressing));

          let name = draft.activityName || "";
          if (draft.activitySlug) {
            const translated = t(
              `activities.activityNames.${draft.activitySlug}`,
              { defaultValue: "" },
            );
            if (
              translated &&
              translated !== `activities.activityNames.${draft.activitySlug}`
            ) {
              name = translated;
            }
          }
          setActivityName(name);
          if (draft.baseMet && setBaseMet) {
            setBaseMet(draft.baseMet);
          }
          if (setActivitySlug) {
            setActivitySlug(draft.activitySlug ?? null);
          }
          // Relevance flags are NOT restored from draft — they come from
          // the ActivityDropdown onSelect callback when the user picks an activity.
          // Restoring them here caused the GPS toggle to flash on page entry.
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
  }, [setTitle, setNotes, setActivityName, setDraftRecordings, setDraftImages, setDraftVideos, t]);

  const saveActivityDraft = useDebouncedCallback(
    async () => {
      const draft = {
        title,
        notes,
        draftRecordings,
        draftImages,
        draftVideos: draftVideos.filter((v) => !v.isCompressing),
      };
      await AsyncStorage.mergeItem("activity_draft", JSON.stringify(draft));
    },
    500,
    { maxWait: 3000 },
  );

  useEffect(() => {
    saveActivityDraft();
  }, [notes, title, draftRecordings, draftImages, draftVideos, saveActivityDraft]);

  return {
    saveActivityDraft,
  };
}
