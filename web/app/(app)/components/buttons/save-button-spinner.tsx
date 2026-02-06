"use client";

import Spinner from "../spinner";
import { useTranslation } from "react-i18next";

type SaveButtonProps = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
};

export default function SaveButtonSpinner({
  onClick,
  label,
  disabled,
  className,
  loading,
}: SaveButtonProps) {
  const { t } = useTranslation("common");
  const buttonLabel = label ?? t("common.save");

  return (
    <button
      aria-label={buttonLabel}
      type="submit"
      onClick={onClick}
      className={`flex items-center justify-center w-full gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200 ${className}`}
      disabled={disabled}
    >
      <p>{buttonLabel}</p>
      {loading && <Spinner />}
    </button>
  );
}
