"use client";

import { useTranslation } from "react-i18next";

type BaseButtonProps = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export default function BaseButton({
  onClick,
  label,
  disabled,
  className,
}: BaseButtonProps) {
  const { t } = useTranslation("common");
  const buttonLabel = label ?? t("common.save");
  return (
    <button
      aria-label={buttonLabel}
      onClick={onClick}
      className={`btn-add w-full flex items-center justify-center gap-2 ${className}`}
      disabled={disabled}
    >
      {buttonLabel}
    </button>
  );
}
