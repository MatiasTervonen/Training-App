"use client";

import { motion } from "framer-motion";
import { ReactNode, useRef } from "react";
import { SquareArrowLeft } from "lucide-react";
import { SquareArrowRight } from "lucide-react";
import { useTransitionDirectionStore } from "@/app/(app)/lib/stores/transitionDirection";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useModalPageConfig } from "@/app/(app)/lib/stores/modalPageConfig";

type Props = {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftLabel?: string;
  rightLabel?: string;
};

export default function ModalPageWrapper({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = "back",
  rightLabel = "home",
}: Props) {
  const { direction, setDirection } = useTransitionDirectionStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const firstRender = useRef(true);

  const { blockSwipe } = useModalPageConfig();

  useEffect(() => {
    firstRender.current = false;
  }, []);

  const handleSwipeLeft = () => {
    setDirection(1);
    if (onSwipeLeft) {
      onSwipeLeft();
    } else {
      router.push("/dashboard");
    }
  };

  const handleSwipeRight = () => {
    setDirection(-1);
    if (onSwipeRight) {
      onSwipeRight();
    } else {
      router.back();
    }
  };

  const EXTRA_NAV_HEIGHT = ["/dashboard", "/menu", "/sessions"].includes(
    pathname
  )
    ? 112
    : 72;

  const fullPage = ["/admin/user-analytics"].includes(pathname)
    ? "w-full"
    : "max-w-3xl";

  return (
    <div
      className={`relative h-[calc(100dvh-${EXTRA_NAV_HEIGHT}px)] overflow-hidden ${fullPage} mx-auto`}
    >
      <div className="absolute inset-0 z-0 h-screen flex justify-between bg-slate-900 mt-3">
        <div className="flex flex-col items-center gap-2 ml-2">
          {isTransitioning && leftLabel && (
            <>
              <div className="text-center text-xl">
                {leftLabel
                  ?.toUpperCase()
                  .split("")
                  .map((letter, index) => (
                    <p key={index}>{letter}</p>
                  ))}
              </div>
              <SquareArrowLeft size={35} className="animate-pulse" />
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 mr-2">
          {isTransitioning && rightLabel && (
            <>
              <div className="text-center text-xl">
                {rightLabel
                  ?.toUpperCase()
                  .split("")
                  .map((letter, index) => (
                    <p key={index}>{letter}</p>
                  ))}
              </div>
              <SquareArrowRight size={35} className="animate-pulse" />
            </>
          )}
        </div>
      </div>

      <motion.div
        key={pathname}
        className="absolute z-30 w-full h-full overflow-y-auto bg-slate-800 grow"
        custom={direction}
        drag={blockSwipe ? false : "x"}
        onAnimationComplete={() => {
          setDirection(0);
        }}
        onDragStart={() => {
          setIsTransitioning(true);
        }}
        dragElastic={0.2}
        dragConstraints={{ left: 0, right: 0 }}
        initial={
          firstRender.current || direction === 0
            ? { x: 0, opacity: 1 }
            : { x: direction > 0 ? 300 : -300, opacity: 0 }
        }
        animate={{ x: 0, opacity: 1 }}
        transition={{
          x: { type: "spring", stiffness: 220, damping: 26 },
          opacity: { duration: 0.25, ease: "easeOut" },
        }}
        onDragEnd={(_, info) => {
          const swipedLeft = info.offset.x < -200;
          const swipedRight = info.offset.x > 200;

          if (swipedLeft || swipedRight) {
            setIsTransitioning(false);
          }

          if (swipedLeft) {
            if (blockSwipe === true) return;
            handleSwipeLeft();
          }

          if (swipedRight) {
            if (blockSwipe === true) return;
            handleSwipeRight();
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
