"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);
  const displayName = selectedFolder?.name ?? t("notes.folders.noFolder");

  if (isLoading) {
    return (
      <div className="flex flex-col w-full">
        <label className="text-gray-300 mb-1 text-sm">
          {t("notes.folders.saveToFolder")}
        </label>
        <div className="w-full p-2 rounded-md border-2 border-gray-400 bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] animate-pulse">
          <div className="h-5 bg-slate-700 rounded w-32" />
        </div>
      </div>
    );
  }

  if (folders.length === 0) return null;

  const options = [
    { id: null, name: t("notes.folders.noFolder") },
    ...folders,
  ];

  return (
    <div className="flex flex-col w-full relative" ref={ref}>
      <label className="text-gray-300 mb-1 text-sm">
        {t("notes.folders.saveToFolder")}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 rounded-md border-2 border-gray-400 text-gray-100 bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300 flex items-center justify-between cursor-pointer"
      >
        <span>{displayName}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-md border-2 border-gray-400 bg-slate-800 overflow-hidden z-50">
          {options.map((option) => {
            const isActive = option.id === selectedFolderId;
            return (
              <button
                key={option.id ?? "none"}
                type="button"
                onClick={() => {
                  onSelect(option.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-gray-100 cursor-pointer hover:bg-blue-900/50 ${
                  isActive ? "bg-blue-900/70" : ""
                }`}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
