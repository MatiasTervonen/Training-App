"use client";

import { useState, useRef } from "react";
import { FolderOpen, ChevronDown, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "@/components/clickOutside";
import useFolders from "@/features/notes/hooks/useFolders";
import useMoveNoteToFolder from "@/features/notes/hooks/useMoveNoteToFolder";

type MoveToFolderDropdownProps = {
  noteId: string;
  currentFolderId: string | null;
  onMoved: () => void;
};

export default function MoveToFolderDropdown({
  noteId,
  currentFolderId,
  onMoved,
}: MoveToFolderDropdownProps) {
  const { t } = useTranslation("notes");
  const { folders } = useFolders();
  const { handleMove } = useMoveNoteToFolder();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const displayName = currentFolder?.name ?? t("notes.folders.unfiled");

  const onSelect = async (folderId: string | null, folderName?: string) => {
    if (folderId === currentFolderId) {
      setIsOpen(false);
      return;
    }
    await handleMove(noteId, folderId, folderName);
    setIsOpen(false);
    onMoved();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700 transition-colors text-sm"
      >
        <FolderOpen size={14} className="text-slate-400" />
        <span className="text-slate-300">{displayName}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 min-w-[200px]">
          {currentFolderId && (
            <button
              onClick={() => onSelect(null)}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-700 text-left text-sm border-b border-slate-700"
            >
              <X size={14} className="text-red-400" />
              <span className="text-red-400">
                {t("notes.folders.removeFromFolder")}
              </span>
            </button>
          )}

          <button
            onClick={() => onSelect(null)}
            className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-700 text-left text-sm border-b border-slate-700 ${
              !currentFolderId ? "bg-slate-700" : ""
            }`}
          >
            <span className="text-slate-300">{t("notes.folders.unfiled")}</span>
            {!currentFolderId && (
              <Check size={14} className="text-blue-500" />
            )}
          </button>

          {folders.map((folder) => {
            const isCurrent = currentFolderId === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => onSelect(folder.id, folder.name)}
                className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-700 text-left text-sm border-b border-slate-700 last:border-0 ${
                  isCurrent ? "bg-slate-700" : ""
                }`}
              >
                <span className="text-slate-300">{folder.name}</span>
                {isCurrent && (
                  <Check size={14} className="text-blue-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
