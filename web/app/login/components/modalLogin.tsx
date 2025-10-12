"use client";

import { ReactNode, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useClickOutside } from "../../(app)/components/clickOutside";

export default function ModalLogin({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, () => onClose());

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <motion.div
          ref={modalRef}
          key={"modal"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 200) {
              onClose();
            }
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-slate-800 relative flex flex-col justify-center items-center mx-auto rounded-xl h-1/2 w-[90vw] max-w-md"
        >
          <button
            className="absolute top-2 right-2 text-gray-100 hover:text-gray-200 z-[100]"
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
          <div className="flex-grow overflow-y-auto touch-pan-y">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
