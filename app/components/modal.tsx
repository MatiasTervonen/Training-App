"use client";

import { ReactNode } from "react";
import Image from "next/image";

export default function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-5 rounded-md w-11/12 relative">
        <button
          className="absolute top-2 right-2 text-gray-100 hover:text-gray-200"
          onClick={onClose}
        >
          <Image
            src="/Close.png"
            alt="Close modal"
            width={40}
            height={40}
            className="hover:cursor-pointer"
          />
        </button>
        {children}
      </div>
    </div>
  );
}
