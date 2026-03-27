"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  onMoveToFolder?: () => void;
  onHide?: () => void;
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
  onMoveToFolder,
  onHide,
}: DropdownMenuProps) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useClickOutside(dropdownRef, () => setOpen(false));

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("scroll", () => setOpen(false), true);
    return () =>
      window.removeEventListener("scroll", () => setOpen(false), true);
  }, [open, updatePos]);

  return (
    <div className="relative flex items-center">
      <button
        ref={triggerRef}
        onClick={() => {
          setOpen((prev) => !prev);
        }}
      >
        {button}
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`fixed z-9999 flex flex-col p-2 rounded-xl border-[1.5px] border-slate-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] w-44 ${className}`}
            style={{
              top: pos.top,
              right: pos.right,
              backgroundColor: "#0f172a",
            }}
            onClick={() => setOpen(false)}
          >
            {onEdit && (
              <button
                className="m-1 py-3 px-2 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-center text-gray-100"
                onClick={onEdit}
              >
                {t("common.edit")}
              </button>
            )}
            {onTogglePin && (
              <button
                className="m-1 py-3 px-2 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-center text-gray-100"
                onClick={onTogglePin}
              >
                {pinned ? t("common.unpin") : t("common.pin")}
              </button>
            )}
            {onMoveToFolder && (
              <button
                className="m-1 py-3 px-2 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-center text-gray-100"
                onClick={onMoveToFolder}
              >
                {t("common.moveToFolder")}
              </button>
            )}
            {onHide && (
              <button
                className="m-1 py-3 px-2 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-center text-gray-100"
                onClick={onHide}
              >
                {t("common.hideFromFeed")}
              </button>
            )}
            {onHistory && (
              <button
                className="m-1 py-3 px-2 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-center text-gray-100"
                onClick={onHistory}
              >
                {t("common.history")}
              </button>
            )}
            {onChange && (
              <button
                className="m-1 py-3 px-2 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-center text-gray-100"
                onClick={onChange}
              >
                {t("common.change")}
              </button>
            )}
            {onDelete && (
              <button
                className="m-1 py-3 px-2 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-center text-gray-100"
                onClick={onDelete}
              >
                {t("common.delete")}
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
