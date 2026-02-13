"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

/**
 * Wrap any interactive element (maps, sliders, carousels…) with this
 * to prevent pointer events from bubbling up to the Modal's drag handler.
 * Uses native listeners so it also blocks Framer Motion's native handlers.
 */
export function ModalSwipeBlocker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e: PointerEvent) => e.stopPropagation();
    el.addEventListener("pointerdown", stop);
    return () => el.removeEventListener("pointerdown", stop);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export default function Modal({
  isOpen,
  onClose,
  children,
  confirmBeforeClose = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  confirmBeforeClose?: boolean;
}) {
  const { t } = useTranslation("common");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClose = () => {
    if (confirmBeforeClose) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-999 bg-black/50">
        <motion.div
          className={`fixed top-0 left-0 right-0 bottom-0`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 200) {
              handleClose();
            }
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="bg-slate-800 relative md:max-w-3xl mx-auto rounded-xl w-[98%] h-[calc(98dvh)] top-[1dvh] grow overflow-y-auto touch-pan-y">
            <button
              className="absolute top-2 right-2 z-10"
              onClick={handleClose}
            >
              <Image
                src="/Close.png"
                alt={t("modal.closeAlt")}
                width={40}
                height={40}
                className="hover:cursor-pointer hover:scale-105"
              />
            </button>

            {children}

            {showConfirm && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 mx-4 max-w-sm w-full">
                  <p className="text-lg text-center mb-6">
                    {t("modal.unsavedPrompt")}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 btn-base"
                    >
                      {t("modal.keepEditing")}
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirm(false);
                        onClose();
                      }}
                      className="flex-1 btn-danger"
                    >
                      {t("modal.discard")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
