import { useQueryClient } from "@tanstack/react-query";
import { renameFolder } from "@/database/notes/rename-folder";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";

export default function useRenameFolder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("notes");

  const handleRename = async (folderId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    try {
      await renameFolder(folderId, trimmed);

      queryClient.setQueryData<FolderWithCount[]>(["folders"], (old = []) =>
        old.map((f) => (f.id === folderId ? { ...f, name: trimmed } : f)),
      );

      queryClient.invalidateQueries({ queryKey: ["folders"] });

      Toast.show({
        type: "success",
        text1: t("notes.folders.folderRenamed"),
      });
    } catch (error) {
      const isDuplicate =
        error instanceof Object && "code" in error && error.code === "23505";
      Toast.show({
        type: "error",
        text1: isDuplicate
          ? t("notes.folders.duplicateName")
          : t("notes.folders.errorRename"),
      });
      throw error;
    }
  };

  return { handleRename };
}
