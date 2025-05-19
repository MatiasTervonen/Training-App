"use client";

import Spinner from "@/app/components/spinner";

import { russoOne } from "@/app/ui/fonts";

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
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={isSaving}
      className={`${russoOne.className}  flex items-center justify-center w-full gap-2  bg-blue-800 py-2  rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
    >
      {isSaving && <Spinner />}
      {isSaving ? savingLabel : label}
    </button>
  );
}
