"use client";

import Spinner from "@/components/spinner";
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
      className={`btn-base flex items-center justify-center gap-2 ${className}`}
      disabled={disabled}
    >
      <p>{buttonLabel}</p>
      {loading && <Spinner />}
    </button>
  );
}
