"use client";

import { useQueryClient } from "@tanstack/react-query";
import { deleteFolder } from "@/database/notes/delete-folder";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";

export default function useDeleteFolder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("notes");

  const handleDelete = async (folder: FolderWithCount) => {
    const message =
      folder.note_count > 0
        ? t("notes.folders.deleteConfirmMessage", {
            count: folder.note_count,
          })
        : t("notes.folders.deleteConfirmEmpty");

    if (!window.confirm(message)) return;

    // Optimistic removal
    queryClient.setQueryData<FolderWithCount[]>(["folders"], (old = []) =>
      old.filter((f) => f.id !== folder.id),
    );

    try {
      await deleteFolder(folder.id);

      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["myNotes"] });

      toast.success(t("notes.folders.folderDeleted"));
    } catch {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.error(t("notes.folders.errorDelete"));
    }
  };

  return { handleDelete };
}
