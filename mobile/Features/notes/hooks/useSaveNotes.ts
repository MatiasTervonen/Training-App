import Toast from "react-native-toast-message";
import { saveNote } from "@/database/notes/save-note";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

export default function useSaveNotes({
  title,
  notes,
  setIsSaving,
  resetNote,
}: {
  title: string;
  notes: string;
  setIsSaving: (isSaving: boolean) => void;
  resetNote: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSaveNotes = async () => {
    if (!notes.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Notes cannot be empty.",
      });
      return;
    }
    setIsSaving(true);

    try {
      await saveNote({ title, notes });

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      await queryClient.refetchQueries({ queryKey: ["myNotes"], exact: true });

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
