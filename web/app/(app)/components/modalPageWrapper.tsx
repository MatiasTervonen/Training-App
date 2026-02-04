"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { SquareArrowLeft } from "lucide-react";
import { SquareArrowRight } from "lucide-react";
import { useTransitionDirectionStore } from "@/app/(app)/lib/stores/transitionDirection";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useModalPageConfig } from "@/app/(app)/lib/stores/modalPageConfig";
import { useTimerStore } from "../lib/stores/timerStore";
import { useTranslation } from "react-i18next";

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
  leftLabel,
  rightLabel,
}: Props) {
  const { t } = useTranslation("common");
  const { direction, setDirection } = useTransitionDirectionStore();

  const resolvedLeftLabel = leftLabel ?? t("navigation.back");
  const resolvedRightLabel = rightLabel ?? t("navigation.home");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const { blockSwipe } = useModalPageConfig();

  const activeSession = useTimerStore((state) => state.activeSession);

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

  const popupHeight =
    (activeSession?.type === "gym" && pathname !== "/gym/gym") ||
    (activeSession?.type === "timer" && pathname !== "/timer/empty-timer") ||
    (activeSession?.type === "disc-golf" && pathname !== "/disc-golf/game")
      ? 92
      : 0;

  let heightClass = "h-[calc(100dvh-72px)]";

  if (["/dashboard", "/menu", "/sessions"].includes(pathname)) {
    heightClass = popupHeight
      ? "h-[calc(100dvh-188px)]"
      : "h-[calc(100dvh-112px)]";
  } else {
    heightClass = popupHeight
      ? "h-[calc(100dvh-164px)]"
      : "h-[calc(100dvh-72px)]";
  }

  const fullPage = ["/admin/user-analytics"].includes(pathname)
    ? "w-full"
    : "max-w-3xl";

  return (
    <div
      className={`relative ${heightClass} overflow-hidden ${fullPage} mx-auto`}
    >
      <div className="absolute inset-0 z-0 h-screen flex justify-between bg-slate-900 pt-3">
        <div className="flex flex-col items-center gap-2 ml-2">
          {isTransitioning && resolvedLeftLabel && (
            <>
              <div className="text-center text-xl">
                {resolvedLeftLabel
                  .toUpperCase()
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
          {isTransitioning && resolvedRightLabel && (
            <>
              <div className="text-center text-xl">
                {resolvedRightLabel
                  .toUpperCase()
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
          direction === 0
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
