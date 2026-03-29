"use client";

import { ReactNode, useRef, useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, animate, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

/**
 * Wrap any interactive element (maps, sliders, carousels…) with this
 * to prevent the swipe-down dismiss gesture from activating on that element.
 */
export function ModalSwipeBlocker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-swipe-block className={className}>
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
  const translateY = useMotionValue(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Refs so native event handlers always see fresh values
  const showConfirmRef = useRef(showConfirm);
  const onCloseRef = useRef(onClose);
  const confirmBeforeCloseRef = useRef(confirmBeforeClose);
  useEffect(() => {
    showConfirmRef.current = showConfirm;
    onCloseRef.current = onClose;
    confirmBeforeCloseRef.current = confirmBeforeClose;
  }, [showConfirm, onClose, confirmBeforeClose]);

  const handleClose = useCallback(() => {
    if (confirmBeforeCloseRef.current) {
      setShowConfirm(true);
    } else {
      onCloseRef.current();
    }
  }, []);

  // Reset state when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      translateY.set(0);
      setShowConfirm(false);
    }
  }

  // Touch-based swipe-down dismiss (like mobile FullScreenModal)
  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (!el) return;

    const FRICTION = 0.7;
    const HANDLE_HEIGHT = 44;
    let startY = 0;
    let dragging = false;
    let startedInHandle = false;
    let blocked = false;

    // --- shared helpers ---
    function begin(clientY: number, target: HTMLElement) {
      if (showConfirmRef.current) return false;
      if (target.closest("[data-swipe-block]")) {
        blocked = true;
        return false;
      }
      startY = clientY;
      dragging = false;
      blocked = false;
      const rect = el!.getBoundingClientRect();
      startedInHandle = clientY <= rect.top + HANDLE_HEIGHT;
      return true;
    }

    function move(clientY: number) {
      if (showConfirmRef.current || blocked) return;
      const dy = clientY - startY;

      if (!dragging) {
        if (dy > 10 && (el!.scrollTop <= 1 || startedInHandle)) {
          dragging = true;
        } else if (Math.abs(dy) > 10) {
          blocked = true;
          return;
        } else {
          return;
        }
      }

      if (dragging) {
        translateY.set(Math.max(0, dy * FRICTION));
      }
    }

    function end() {
      if (!dragging) return;
      const threshold = window.innerHeight * 0.15;

      if (translateY.get() > threshold) {
        if (confirmBeforeCloseRef.current) {
          animate(translateY, 0, {
            type: "spring",
            stiffness: 220,
            damping: 15,
          });
          setShowConfirm(true);
        } else {
          animate(translateY, window.innerHeight, {
            duration: 0.3,
            onComplete: () => onCloseRef.current(),
          });
        }
      } else {
        animate(translateY, 0, {
          type: "spring",
          stiffness: 220,
          damping: 15,
        });
      }
      dragging = false;
    }

    // --- touch (mobile) ---
    const onTouchStart = (e: TouchEvent) => {
      begin(e.touches[0].clientY, e.target as HTMLElement);
    };
    const onTouchMove = (e: TouchEvent) => {
      move(e.touches[0].clientY);
      if (dragging) e.preventDefault();
    };
    const onTouchEnd = () => end();

    // --- mouse (desktop) ---
    let mouseDown = false;
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // left-click only
      if (begin(e.clientY, e.target as HTMLElement)) {
        mouseDown = true;
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDown) return;
      move(e.clientY);
      if (dragging) {
        e.preventDefault();
        // Prevent text selection while dragging
        window.getSelection()?.removeAllRanges();
      }
    };
    const onMouseUp = () => {
      if (!mouseDown) return;
      mouseDown = false;
      end();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("mousedown", onMouseDown);
    // mouse move/up on window so drag works even when cursor leaves the modal
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isOpen, translateY, handleClose]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-999 bg-black/50">
        <motion.div
          className="fixed top-0 left-0 right-0 bottom-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ y: translateY }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div
            ref={scrollRef}
            className="bg-[#131c2b] relative md:max-w-3xl mx-auto rounded-xl w-[98%] h-[calc(98dvh)] top-[1dvh] grow overflow-y-auto overscroll-y-contain shadow-[0_0_20px_rgba(59,130,246,0.4)]"
          >
            {/* Drag handle indicator */}
            <div className="sticky top-0 z-10 flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-400" />
            </div>

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
