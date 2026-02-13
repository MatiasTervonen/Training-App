"use client";

import React, { useRef, useState } from "react";
import { useClickOutside } from "@/components/clickOutside";
import { useTranslation } from "react-i18next";

type DropdownMenuProps = {
  button: React.ReactNode;
  pinned?: boolean;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onHistory?: () => void;
  onChange?: () => void;
  onTogglePin?: () => void;
};

export default function DropdownMenu({
  button,
  pinned,
  className,
  onEdit,
  onDelete,
  onHistory,
  onChange,
  onTogglePin,
}: DropdownMenuProps) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setOpen(false));

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button onClick={() => setOpen((prev) => !prev)}>{button}</button>

      {open && (
        <div
          className={`absolute right-0 top-full flex flex-col border-2 border-blue-500 text-gray-100 shadow-lg rounded-md z-50 w-[150px] bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 ${className}`}
          onClick={() => setOpen(false)}
        >
          {onEdit && (
            <button
              className="border-b py-2  border-blue-500 hover:bg-gray-600 hover:rounded-t"
              onClick={onEdit}
            >
              {t("common.edit")}
            </button>
          )}
          {onTogglePin && (
            <button
              className="py-2  border-b border-blue-500 hover:bg-gray-600"
              onClick={onTogglePin}
            >
              {pinned ? t("common.unpin") : t("common.pin")}
            </button>
          )}
          {onHistory && (
            <button
              className="py-2 border-b border-blue-500  hover:bg-gray-600 hover:rounded-t"
              onClick={onHistory}
            >
              {t("common.history")}
            </button>
          )}
          {onChange && (
            <button
              className="py-2 border-b border-blue-500 hover:bg-gray-600"
              onClick={onChange}
            >
              {t("common.change")}
            </button>
          )}
          {onDelete && (
            <button
              className="py-2  hover:bg-gray-600 hover:rounded-b"
              onClick={onDelete}
            >
              {t("common.delete")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
