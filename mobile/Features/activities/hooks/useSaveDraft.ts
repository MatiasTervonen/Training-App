import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";
import { useTranslation } from "react-i18next";

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
  setActivityName,
  setDraftRecordings,
  setBaseMet,
}: {
  title: string;
  notes: string;
  draftRecordings: DraftRecording[];
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  setActivityName: (activityName: string) => void;
  setDraftRecordings: (recordings: DraftRecording[]) => void;
  setBaseMet?: (baseMet: number) => void;
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
  }, [setTitle, setNotes, setActivityName, setDraftRecordings, t]);

  const saveActivityDraft = useDebouncedCallback(
    async () => {
      const draft = { title, notes };
      await AsyncStorage.mergeItem("activity_draft", JSON.stringify(draft));
    },
    500,
    { maxWait: 3000 },
  );

  useEffect(() => {
    saveActivityDraft();
  }, [notes, title, draftRecordings, saveActivityDraft]);

  return {
    saveActivityDraft,
  };
}
