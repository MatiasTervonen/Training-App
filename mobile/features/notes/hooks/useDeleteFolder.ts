import { useQueryClient } from "@tanstack/react-query";
import { deleteFolder } from "@/database/notes/delete-folder";
import { useConfirmAction } from "@/lib/confirmAction";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";

export default function useDeleteFolder() {
  const queryClient = useQueryClient();
  const confirmAction = useConfirmAction();
  const { t } = useTranslation("notes");

  const handleDelete = async (folder: FolderWithCount) => {
    const message =
      folder.note_count > 0
        ? t("notes.folders.deleteConfirmMessage", {
            count: folder.note_count,
          })
        : t("notes.folders.deleteConfirmEmpty");

    const confirmed = await confirmAction({
      title: t("notes.folders.deleteConfirmTitle"),
      message,
    });

    if (!confirmed) return;

    // Optimistic removal
    queryClient.setQueryData<FolderWithCount[]>(["folders"], (old = []) =>
      old.filter((f) => f.id !== folder.id),
    );

    try {
      await deleteFolder(folder.id);

      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["myNotes"] });

      Toast.show({
        type: "success",
        text1: t("notes.folders.folderDeleted"),
      });
    } catch {
      // Rollback
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      Toast.show({
        type: "error",
        text1: t("notes.folders.errorDelete"),
      });
    }
  };

  return { handleDelete };
}
