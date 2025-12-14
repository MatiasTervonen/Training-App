"use client";

interface DeleteSessionBtnProps {
  onDelete: () => void;
  label?: string;
  confirm?: boolean;
  disabled?: boolean;
  confirmMessage?: string;
}

export default function DeleteSessionBtn({
  onDelete,
  label = "Delete",
  confirm = true,
  disabled = false,
  confirmMessage = "Are you sure you want to delete this session?",
}: DeleteSessionBtnProps) {
  const handleDelete = () => {
    if (confirm) {
      const confirmed = window.confirm(confirmMessage);

      if (!confirmed) return;
    }

    onDelete();
  };

  return (
    <button
      className="flex items-center justify-center w-full  bg-red-800 py-2 rounded-md shadow-xl border-2 border-red-500 text-gray-100 text-lg cursor-pointer hover:bg-red-700 hover:scale-105 transition-all duration-200"
      onClick={handleDelete}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
