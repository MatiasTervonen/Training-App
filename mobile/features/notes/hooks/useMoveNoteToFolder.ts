import { useQueryClient } from "@tanstack/react-query";
import { moveNoteToFolder } from "@/database/notes/move-note-to-folder";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

export default function useMoveNoteToFolder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("notes");

  const handleMove = async (
    noteId: string,
    folderId: string | null,
    folderName?: string,
  ) => {
    try {
      await moveNoteToFolder(noteId, folderId);

      queryClient.invalidateQueries({ queryKey: ["myNotes"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });

      Toast.show({
        type: "success",
        text1: folderId
          ? t("notes.folders.movedToFolder", { folder: folderName })
          : t("notes.folders.removedFromFolder"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("notes.folders.errorMove"),
      });
    }
  };

  return { handleMove };
}
