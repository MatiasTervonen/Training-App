"use client";

import { useTranslation } from "react-i18next";

interface DeleteSessionBtnProps {
  onDelete: () => void;
  label?: string;
  confirm?: boolean;
  disabled?: boolean;
  confirmMessage?: string;
}

export default function DeleteSessionBtn({
  onDelete,
  label,
  confirm = true,
  disabled = false,
  confirmMessage,
}: DeleteSessionBtnProps) {
  const { t } = useTranslation("common");

  const buttonLabel = label ?? t("common.delete");
  const message = confirmMessage ?? t("deleteButton.confirmDeleteMessage");

  const handleDelete = () => {
    if (confirm) {
      const confirmed = window.confirm(message);

      if (!confirmed) return;
    }

    onDelete();
  };

  return (
    <button
      className="flex items-center justify-center btn-danger"
      onClick={handleDelete}
      disabled={disabled}
    >
      {buttonLabel}
    </button>
  );
}
