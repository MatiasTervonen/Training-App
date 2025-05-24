"use client";

import { russoOne } from "@/app/ui/fonts";

interface DeleteSessionBtnProps {
  storageKey?: string[];
  onDelete?: () => void;
  label?: string;
}

export default function DeleteSessionBtn({
  storageKey,
  onDelete,
  label = "Delete",
}: DeleteSessionBtnProps) {
  const handleDelete = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this session?"
    );
    if (!confirmed) return;

    storageKey?.forEach((key) => {
      localStorage.removeItem(key);
    });

    if (onDelete) onDelete();
  };

  return (
    <button
      className={`${russoOne.className} flex items-center justify-center w-full  bg-red-800 py-2 rounded-md shadow-xl border-2 border-red-500 text-gray-100 text-lg cursor-pointer hover:bg-red-700 hover:scale-95`}
      onClick={handleDelete}
    >
      {label}
    </button>
  );
}
