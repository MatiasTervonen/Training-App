"use client";

import Spinner from "@/app/(app)/components/spinner";
import { russoOne } from "@/app/ui/fonts";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";

type SaveButtonProps = {
  isSaving: boolean;
  onClick: () => void;
  label?: string;
  savingLabel?: string;
};

export default function SaveButton({
  isSaving,
  onClick,
  label = "Finish",
  savingLabel = "Saving...",
}: SaveButtonProps) {
  const isGuest = useUserStore((state) => state.isGuest);

  if (isGuest) {
    return (
      <button
        type="button"
        disabled
        className={`${russoOne.className}  flex items-center justify-center w-full gap-2 bg-gray-400 py-2 rounded-md shadow-xl border-2 border-gray-300 text-gray-100 text-lg cursor-not-allowed`}
      >
        Save (not allowed)
      </button>
    );
  }

  return (
    <button
      aria-label={isSaving ? savingLabel : label}
      type="submit"
      onClick={onClick}
      disabled={isSaving}
      className={`${russoOne.className}  flex items-center justify-center w-full gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
    >
      {isSaving && <Spinner />}
      {isSaving ? savingLabel : label}
    </button>
  );
}
