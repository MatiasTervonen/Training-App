"use client";

import Spinner from "@/app/components/spinner";

import { russoOne } from "@/app/ui/fonts";

type SaveButtonProps = {
  isSaving: boolean;
  onClick: () => void;
};

export default function SaveButton({ isSaving, onClick }: SaveButtonProps) {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={isSaving}
      className={`${russoOne.className} w-full flex items-center justify-center gap-2 text-gray-100 font-bold border-b-3 border-l-3 border-blue-950 py-2 px-10 rounded-md bg-blue-900 hover:bg-blue-800 hover:scale-95`}
    >
      {isSaving && <Spinner />}
      {isSaving ? "Saving..." : "Finish"}
    </button>
  );
}
