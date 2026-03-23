import Toast from "react-native-toast-message";
import { saveNote } from "@/database/notes/save-note";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { DraftRecording, DraftVideo } from "@/types/session";

type DraftImage = {
  id: string;
  uri: string;
};

type saveNotesProps = {
  title: string;
  notes: string;
  folderId?: string | null;
  draftRecordings: DraftRecording[];
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
  setIsSaving: (isSaving: boolean) => void;
  setSavingProgress?: (progress: number | undefined) => void;
  resetNote: () => void;
};

export default function useSaveNotes({
  title,
  notes,
  folderId,
  draftRecordings,
  draftImages = [],
  draftVideos = [],
  setIsSaving,
  setSavingProgress,
  resetNote,
}: saveNotesProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation(["notes", "common"]);

  const handleSaveNotes = async () => {
    if (draftVideos.some((v) => v.isCompressing)) {
      Toast.show({ type: "info", text1: t("common.media.videoStillCompressing") });
      return;
    }
    if (!title.trim()) {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("notes:notes.save.titleRequired"),
      });
      return;
    }
    setIsSaving(true);
    setSavingProgress?.(undefined);

    try {
      await saveNote({
        title,
        notes,
        folderId,
        draftRecordings,
        draftImages,
        draftVideos,
        onProgress: (p) => setSavingProgress?.(p),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feed"], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["myNotes"] }),
        queryClient.invalidateQueries({ queryKey: ["folders"] }),
      ]);

      router.push("/dashboard");
      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("notes:notes.save.success"),
      });
      resetNote();
    } catch {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("notes:notes.save.error"),
      });
      setIsSaving(false);
    }
  };
  return {
    handleSaveNotes,
  };
}
