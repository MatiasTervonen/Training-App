import Toast from "react-native-toast-message";
import { saveNote } from "@/database/notes/save-note";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { DraftRecording } from "@/types/session";

type saveNotesProps = {
  title: string;
  notes: string;
  draftRecordings: DraftRecording[];
  setIsSaving: (isSaving: boolean) => void;
  resetNote: () => void;
};

export default function useSaveNotes({
  title,
  notes,
  draftRecordings,
  setIsSaving,
  resetNote,
}: saveNotesProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSaveNotes = async () => {
    if (!title.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Title cannot be empty.",
      });
      return;
    }
    setIsSaving(true);

    try {
      await saveNote({ title, notes, draftRecordings });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feed"], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["myNotes"], exact: true }),
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
