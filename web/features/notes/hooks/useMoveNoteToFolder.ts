"use client";

import { useQueryClient } from "@tanstack/react-query";
import { moveNoteToFolder } from "@/database/notes/move-note-to-folder";
import toast from "react-hot-toast";
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

      toast.success(
        folderId
          ? t("notes.folders.movedToFolder", { folder: folderName })
          : t("notes.folders.removedFromFolder"),
      );
    } catch {
      toast.error(t("notes.folders.errorMove"));
    }
  };

  return { handleMove };
}
