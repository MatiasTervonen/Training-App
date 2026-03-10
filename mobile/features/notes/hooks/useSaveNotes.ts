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
  const { t } = useTranslation("common");

  const handleSaveNotes = async () => {
    if (draftVideos.some((v) => v.isCompressing)) {
      Toast.show({ type: "info", text1: t("common.media.videoStillCompressing") });
      return;
    }
    if (!title.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Title cannot be empty.",
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
        text1: "Success",
        text2: "Note saved successfully!",
      });
      resetNote();
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save notes. Please try again.",
      });
      setIsSaving(false);
    }
  };
  return {
    handleSaveNotes,
  };
}
