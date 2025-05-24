"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-28 left-0 right-0 bottom-0 bg-black/50 z-50 overflow-y-auto border-t-2 border-green-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 150) {
            onClose();
          }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-center">
          <motion.div
            className="bg-slate-900  rounded-md w-full relative max-h-screen overflow-y-auto"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 150) {
                onClose();
              }
            }}
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <button
              className=" absolute top-2 right-2 text-gray-100 hover:text-gray-200 z-50"
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
            <div className="pb-12 p-2">{children}</div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
