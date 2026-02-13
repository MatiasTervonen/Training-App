"use client";

import { useTranslation } from "react-i18next";

type EditButtonProps = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export default function EditButton({
  onClick,
  label,
  disabled,
  className,
}: EditButtonProps) {
  const { t } = useTranslation("common");
  const buttonLabel = label ?? t("common.edit");

  return (
    <button
      aria-label={buttonLabel}
      onClick={onClick}
      className={`flex items-center justify-center w-full gap-2 bg-amber-700 py-2 rounded-md shadow-md border-2 border-amber-500 text-lg cursor-pointer hover:bg-amber-700 hover:scale-105 transition-all duration-200 ${className}`}
      disabled={disabled}
    >
      {buttonLabel}
    </button>
  );
}
