"use client";

import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import Spinner from "../components/spinner";

type SaveButtonProps = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
};

export default function SaveButtonSpinner({
  onClick,
  label = "Save",
  disabled,
  className,
  loading,
}: SaveButtonProps) {
  const isGuest = useUserStore((state) => state.role === "guest");

  if (isGuest) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center justify-center w-full gap-2 bg-gray-400 py-2 rounded-md shadow-xl border-2 border-gray-300 text-gray-100 text-lg cursor-not-allowed"
      >
        Save (not allowed)
      </button>
    );
  }

  return (
    <button
      aria-label={label}
      type="submit"
      onClick={onClick}
      className={`flex items-center justify-center w-full gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200 ${className}`}
      disabled={disabled}
    >
      <p>{label}</p>
      {loading && <Spinner />}
    </button>
  );
}
