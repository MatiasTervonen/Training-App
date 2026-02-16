"use client";

import { FolderOpen, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import useFolders from "@/features/notes/hooks/useFolders";
import useMoveNoteToFolder from "@/features/notes/hooks/useMoveNoteToFolder";

type MoveToFolderListProps = {
  noteId: string;
  currentFolderId: string | null;
  onMoved: () => void;
};

export default function MoveToFolderDropdown({
  noteId,
  currentFolderId,
  onMoved,
}: MoveToFolderListProps) {
  const { t } = useTranslation("notes");
  const { folders } = useFolders();
  const { handleMove } = useMoveNoteToFolder();

  const onSelect = async (folderId: string | null, folderName?: string) => {
    if (folderId === currentFolderId) {
      onMoved();
      return;
    }
    await handleMove(noteId, folderId, folderName);
    onMoved();
  };

  return (
    <div>
      {currentFolderId && (
        <button
          onClick={() => onSelect(null)}
          className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
        >
          <X size={18} className="text-red-400" />
          <span className="text-red-400">
            {t("notes.folders.removeFromFolder")}
          </span>
        </button>
      )}

      {folders.map((folder) => {
        const isCurrent = currentFolderId === folder.id;
        return (
          <button
            key={folder.id}
            onClick={() => onSelect(folder.id, folder.name)}
            className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-slate-700 last:border-0 hover:bg-slate-700/50 transition-colors ${
              isCurrent ? "bg-slate-700/50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderOpen size={18} className="text-slate-400" />
              <span className="text-slate-200">{folder.name}</span>
            </div>
            {isCurrent && <Check size={18} className="text-blue-500" />}
          </button>
        );
      })}

      {folders.length === 0 && (
        <p className="text-center text-lg mt-10 text-slate-400">
          {t("notes.folders.noFolders")}
        </p>
      )}
    </div>
  );
}
