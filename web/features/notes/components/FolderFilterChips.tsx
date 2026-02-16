"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";

type FolderFilterChipsProps = {
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  isUnfiledSelected: boolean;
  onSelectAll: () => void;
  onSelectUnfiled: () => void;
  onSelectFolder: (folderId: string) => void;
};

export default function FolderFilterChips({
  folders,
  selectedFolderId,
  isUnfiledSelected,
  onSelectAll,
  onSelectUnfiled,
  onSelectFolder,
}: FolderFilterChipsProps) {
  const { t } = useTranslation("notes");
  const isAllSelected = !selectedFolderId && !isUnfiledSelected;

  const chipBase =
    "px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer whitespace-nowrap";
  const activeChip = "bg-blue-600 text-white";
  const inactiveChip =
    "bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700";

  return (
    <div className="flex flex-wrap gap-2 py-3">
      <button
        onClick={onSelectAll}
        className={`${chipBase} ${isAllSelected ? activeChip : inactiveChip}`}
      >
        {t("notes.folders.all")}
      </button>

      <button
        onClick={onSelectUnfiled}
        className={`${chipBase} ${isUnfiledSelected ? activeChip : inactiveChip}`}
      >
        {t("notes.folders.unfiled")}
      </button>

      {folders.map((folder) => {
        const isActive = selectedFolderId === folder.id;
        return (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className={`${chipBase} ${isActive ? activeChip : inactiveChip}`}
          >
            {folder.name}
          </button>
        );
      })}

      <Link
        href="/notes/folders"
        className={`${chipBase} ${inactiveChip} flex items-center gap-1.5`}
      >
        <Settings size={14} />
        {t("notes.folders.manageFolders")}
      </Link>
    </div>
  );
}
