"use client";

import { useTranslation } from "react-i18next";

type SaveButtonProps = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export default function SaveButton({
  onClick,
  label,
  disabled,
  className,
}: SaveButtonProps) {
  const { t } = useTranslation("common");
  const buttonLabel = label ?? t("common.save");
  return (
    <button
      aria-label={buttonLabel}
      type="submit"
      onClick={onClick}
      className={`btn-base ${className}`}
      disabled={disabled}
    >
      {buttonLabel}
    </button>
  );
}
