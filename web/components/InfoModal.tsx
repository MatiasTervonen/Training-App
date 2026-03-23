"use client";

import { ReactNode } from "react";
import { Info } from "lucide-react";
import portal from "react-dom";

export default function InfoModal({
  isOpen,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return portal.createPortal(
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5">
      <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md border-[1.5px] border-slate-600 shadow-lg shadow-blue-500/40">
        <div className="mb-5 flex justify-center">
          <Info size={35} color="#fbbf24" />
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}
