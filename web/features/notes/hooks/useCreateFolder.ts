"use client";

import { useQueryClient } from "@tanstack/react-query";
import { saveFolder } from "@/database/notes/save-folder";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";

export default function useCreateFolder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("notes");

  const createFolder = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      const newFolder = await saveFolder(trimmed);

      queryClient.setQueryData<FolderWithCount[]>(["folders"], (old = []) => [
        ...old,
        { ...newFolder, note_count: 0 },
      ]);

      queryClient.invalidateQueries({ queryKey: ["folders"] });

      toast.success(t("notes.folders.folderCreated"));
      return newFolder;
    } catch (error) {
      const isDuplicate =
        error instanceof Object && "code" in error && error.code === "23505";
      toast.error(
        isDuplicate
          ? t("notes.folders.duplicateName")
          : t("notes.folders.errorCreate"),
      );
      throw error;
    }
  };

  return { createFolder };
}
