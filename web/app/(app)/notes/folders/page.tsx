"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X, ArrowRight, FolderOpen, FolderCog } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import TitleInput from "@/ui/TitleInput";
import useFolders from "@/features/notes/hooks/useFolders";
import useCreateFolder from "@/features/notes/hooks/useCreateFolder";
import useRenameFolder from "@/features/notes/hooks/useRenameFolder";
import useDeleteFolder from "@/features/notes/hooks/useDeleteFolder";
import FolderFilterChips from "@/features/notes/components/FolderFilterChips";
import { useRouter } from "next/navigation";
import type { FolderWithCount } from "@/database/notes/get-folders";

export default function ManageFoldersPage() {
  const { t } = useTranslation("notes");
  const router = useRouter();
  const { folders, isLoading } = useFolders();
  const { createFolder } = useCreateFolder();
  const { handleRename } = useRenameFolder();
  const { handleDelete } = useDeleteFolder();

  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreate = async () => {
    if (!newFolderName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await createFolder(newFolderName);
      setNewFolderName("");
    } catch {
      // Error handled in hook
    } finally {
      setIsCreating(false);
    }
  };

  const startRename = (folder: FolderWithCount) => {
    setEditingId(folder.id);
    setEditingName(folder.name);
  };

  const confirmRename = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      await handleRename(editingId, editingName);
    } catch {
      // Error handled in hook
    }
    setEditingId(null);
    setEditingName("");
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="max-w-2xl mx-auto px-5 pt-3 pb-10">
      {/* Folder filter chips */}
      <div className="sticky top-0 z-10 flex items-center gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <FolderFilterChips
            folders={folders}
            selectedFolderId={"__folders__"}
            onSelectAll={() => router.push("/notes")}
            onSelectFolder={(id) => router.push(`/notes?folder=${id}`)}
          />
        </div>
        <Link
          href="/notes/folders"
          className="shrink-0 px-3 py-2 bg-slate-700 rounded-md transition-colors"
        >
          <FolderCog size={20} className="text-cyan-400" />
        </Link>
      </div>

      {/* Create folder input */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5 mb-8">
        <div className="flex-1">
          <TitleInput
            value={newFolderName}
            setValue={setNewFolderName}
            label={t("notes.folders.folderName")}
            placeholder={t("notes.folders.folderNamePlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={!newFolderName.trim() || isCreating}
          className="btn-add px-10"
        >
          {t("notes.folders.createFolder")}
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && folders.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title={t("notes.folders.noFolders")}
          description={t("notes.folders.noFoldersDesc")}
        />
      )}

      {/* Folder list */}
      {!isLoading && folders.length > 0 && (
        <div className="flex flex-col gap-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 flex items-center justify-between"
            >
              {editingId === folder.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <TitleInput
                    value={editingName}
                    setValue={setEditingName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmRename();
                      if (e.key === "Escape") cancelRename();
                    }}
                    autoFocus
                  />
                  <button
                    onClick={confirmRename}
                    className="p-2 hover:bg-slate-700 rounded"
                  >
                    <Check size={18} className="text-green-500" />
                  </button>
                  <button
                    onClick={cancelRename}
                    className="p-2 hover:bg-slate-700 rounded"
                  >
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href={`/notes/my-notes?folder=${folder.id}`}
                    className="flex-1 mr-3 hover:opacity-80 transition-opacity"
                  >
                    <p className="text-slate-200">{folder.name}</p>
                    <p className="text-xs text-slate-400">
                      {t("notes.folders.noteCount", {
                        count: folder.note_count,
                      })}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startRename(folder)}
                      className="p-2 hover:bg-slate-700 rounded cursor-pointer"
                    >
                      <Pencil size={16} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(folder)}
                      className="p-2 hover:bg-slate-700 rounded cursor-pointer"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                    <Link
                      href={`/notes/my-notes?folder=${folder.id}`}
                      className="p-2 hover:bg-slate-700 rounded"
                    >
                      <ArrowRight size={16} className="text-slate-400" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
