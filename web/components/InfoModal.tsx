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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-xl w-[90vw] max-w-md border-2 border-gray-100">
        <div className="ml-5 mt-5">
          <Info size={35} color="#fbbf24" />
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}
