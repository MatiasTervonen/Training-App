"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Reply, Copy, Forward, Trash2 } from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

type MessageContextMenuProps = {
  x: number;
  y: number;
  isOwn: boolean;
  isDeleted: boolean;
  hasTextContent: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
};

export default function MessageContextMenu({
  x,
  y,
  isOwn,
  isDeleted,
  hasTextContent,
  onClose,
  onReply,
  onCopy,
  onForward,
  onDelete,
  onReact,
}: MessageContextMenuProps) {
  const { t } = useTranslation("chat");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const rect = menu.getBoundingClientRect();
    const padding = 8;
    let left = x;
    let top = y;

    if (left + rect.width > window.innerWidth - padding) {
      left = window.innerWidth - rect.width - padding;
    }
    if (left < padding) left = padding;

    if (top + rect.height > window.innerHeight - padding) {
      top = window.innerHeight - rect.height - padding;
    }
    if (top < padding) top = padding;

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }, [x, y]);

  const style: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 9999,
  };

  return createPortal(
    <div ref={menuRef} style={style} className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[180px]">
      {/* Quick reactions */}
      {!isDeleted && (
        <div className="flex gap-1 p-2 border-b border-slate-700">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onReact(emoji); onClose(); }}
              className="text-lg hover:bg-slate-700 rounded-md w-8 h-8 flex items-center justify-center transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="py-1">
        {!isDeleted && (
          <button
            onClick={() => { onReply(); onClose(); }}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-slate-700 transition-colors"
          >
            <Reply size={16} />
            {t("chat.reply")}
          </button>
        )}
        {hasTextContent && !isDeleted && (
          <button
            onClick={() => { onCopy(); onClose(); }}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-slate-700 transition-colors"
          >
            <Copy size={16} />
            {t("chat.copy")}
          </button>
        )}
        {!isDeleted && (
          <button
            onClick={() => { onForward(); onClose(); }}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-slate-700 transition-colors"
          >
            <Forward size={16} />
            {t("chat.forward")}
          </button>
        )}
        {isOwn && !isDeleted && (
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
          >
            <Trash2 size={16} />
            {t("chat.delete")}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
