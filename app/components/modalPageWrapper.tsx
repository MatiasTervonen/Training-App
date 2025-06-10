"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { SquareArrowLeft } from "lucide-react";
import { SquareArrowRight } from "lucide-react";
import { useTransitionDirectionStore } from "../../lib/stores/transitionDirection";
import { useState } from "react";
import { russoOne } from "../ui/fonts";

export default function ModalPageWrapper({
  children,
  noTopPadding = false,
  onSwipeLeft,
  onSwipeRight,
  leftLabel,
  rightLabel,
}: {
  children: ReactNode;
  noTopPadding?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const direction = useTransitionDirectionStore((state) => state.direction);
  const setDirection = useTransitionDirectionStore(
    (state) => state.setDirection
  );

  const [isTransitioning, setIsTransitioning] = useState(false);

  return (
    <div
      className={`${
        russoOne.className
      } relative h-[calc(100dvh-72px)] overflow-hidden  ${
        noTopPadding ? "" : "pt-[40px]"
      }`}
    >
      <div
        className={`absolute inset-0 z-0 h-screen flex justify-between bg-slate-900  ${
          noTopPadding ? "pt-[10px]" : "pt-[50px]"
        }`}
      >
        <div className="flex flex-col items-center gap-2 ml-2">
          {isTransitioning && leftLabel && (
            <>
              <div className="text-gray-100 text-center text-xl">
                {leftLabel
                  ?.toUpperCase()
                  .split("")
                  .map((letter, index) => (
                    <p key={index}>{letter}</p>
                  ))}
              </div>
              <SquareArrowLeft
                size={35}
                className="text-gray-100 animate-pulse"
              />
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 mr-2">
          {isTransitioning && rightLabel && (
            <>
              <div className="text-gray-100 text-center text-xl">
                {rightLabel
                  ?.toUpperCase()
                  .split("")
                  .map((letter, index) => (
                    <p key={index}>{letter}</p>
                  ))}
              </div>
              <SquareArrowRight
                size={35}
                className="text-gray-100 animate-pulse"
              />
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        <motion.div
          className="absolute z-30 w-full h-full overflow-y-auto bg-slate-800"
          initial="enter"
          animate="center"
          custom={direction}
          exit="exit"
          drag="x"
          onAnimationComplete={() => {
            setDirection(0);
          }}
          onDragStart={() => {
            setIsTransitioning(true);
          }}
          dragElastic={0.2}
          dragConstraints={{ left: 0, right: 0 }}
          variants={{
            enter: (direction: number) =>
              direction === 0
                ? { x: 0, opacity: 1 }
                : { x: direction > 0 ? 300 : -300, opacity: 0 },
            center: {
              x: 0,
              opacity: 1,
            },
            exit: (direction: number) =>
              direction === 0
                ? { x: 0, opacity: 1 }
                : { x: direction > 0 ? -300 : 300, opacity: 0 },
          }}
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          onDragEnd={(_, info) => {
            const swipedLeft = info.offset.x < -200;
            const swipedRight = info.offset.x > 200;

            if (swipedLeft) {
              if (onSwipeLeft) {
                setDirection(1);
                onSwipeLeft();
              }
            }

            if (swipedRight) {
              if (onSwipeRight) {
                setDirection(-1);
                onSwipeRight();
              }
            }
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
