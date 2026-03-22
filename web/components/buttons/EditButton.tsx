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
      className={`btn-base w-full text-lg ${className}`}
      disabled={disabled}
    >
      {buttonLabel}
    </button>
  );
}
