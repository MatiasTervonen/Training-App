"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function Modal({
  isOpen,
  onClose,
  children,
  footerButton,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  footerButton?: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50  bg-black/50">
        <motion.div
          className="fixed top-0 left-0 right-0 bottom-0 z-50"
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
        >
          <div className="bg-slate-800 relative mt-28 h-[calc(100dvh-7rem)] flex flex-col xl:max-w-3xl mx-auto">
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

            <div
              className={`flex-grow overflow-y-auto touch-pan-y ${
                !footerButton ? "pb-16" : ""
              }`}
            >
              {children}
            </div>

            {footerButton && (
              <div className="flex justify-center items-center p-4 border-t border-gray-700">
                {footerButton}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
