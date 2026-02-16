"use client";

import { useQueryClient } from "@tanstack/react-query";
import { renameFolder } from "@/database/notes/rename-folder";
import toast from "react-hot-toast";
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

      toast.success(t("notes.folders.folderRenamed"));
    } catch (error) {
      const isDuplicate =
        error instanceof Object && "code" in error && error.code === "23505";
      toast.error(
        isDuplicate
          ? t("notes.folders.duplicateName")
          : t("notes.folders.errorRename"),
      );
      throw error;
    }
  };

  return { handleRename };
}
