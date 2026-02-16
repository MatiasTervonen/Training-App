"use client";

import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";

type FolderPickerProps = {
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  isLoading: boolean;
};

export default function FolderPicker({
  folders,
  selectedFolderId,
  onSelect,
  isLoading,
}: FolderPickerProps) {
  const { t } = useTranslation("notes");

  if (isLoading) {
    return (
      <div className="w-full">
        <label className="text-sm text-slate-400 mb-1 block">
          {t("notes.folders.saveToFolder")}
        </label>
        <div className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 animate-pulse">
          <div className="h-5 bg-slate-700 rounded w-32" />
        </div>
      </div>
    );
  }

  if (folders.length === 0) return null;

  return (
    <div className="w-full">
      <label className="text-sm text-slate-400 mb-1 block">
        {t("notes.folders.saveToFolder")}
      </label>
      <select
        value={selectedFolderId ?? ""}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{t("notes.folders.unfiled")}</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>
    </div>
  );
}
