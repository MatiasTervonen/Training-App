"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState } from "react";
import { SquareArrowLeft, SquareArrowRight } from "lucide-react";
import { useTransitionDirectionStore } from "@/lib/stores/transitionDirection";

type Props = {
  viewingHoleNumber: number;
  totalHoles: number;
  onNextHole: () => void;
  onPreviousHole: () => void;
  onFinishGame: () => void;
  children: ReactNode;
};

export default function SwipeWrapper({
  children,
  viewingHoleNumber,
  totalHoles,
  onNextHole,
  onPreviousHole,
  onFinishGame,
}: Props) {
  const { direction, setDirection } = useTransitionDirectionStore();
  const [isSwiping, setIsSwiping] = useState(false);

  return (
    <>
      <div className="absolute inset-0 z-0 h-screen flex justify-between bg-slate-950">
        {!isSwiping && (
          <>
            <div className="flex flex-col items-center pt-2.5 gap-2 mx-2">
              {viewingHoleNumber > 1 && (
                <>
                  <div className="text-center text-2xl">
                    <p>H</p>
                    <p>O</p>
                    <p>L</p>
                    <p>E</p>
                    <p>{viewingHoleNumber - 1}</p>
                  </div>
                  <SquareArrowLeft size={35} className="animate-pulse" />
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 mx-2 pt-2.5">
              {viewingHoleNumber === totalHoles ? (
                <div className="text-center text-2xl">
                  <p>F</p>
                  <p>I</p>
                  <p>N</p>
                  <p>I</p>
                  <p>S</p>
                  <p>H</p>
                </div>
              ) : (
                <div className="text-center text-2xl">
                  <p>H</p>
                  <p>O</p>
                  <p>L</p>
                  <p>E</p>
                  <p>{viewingHoleNumber + 1}</p>
                </div>
              )}

              <SquareArrowRight size={35} className="animate-pulse" />
            </div>
          </>
        )}
      </div>

      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={viewingHoleNumber}
          className="absolute z-30 w-full h-full overflow-y-auto bg-slate-900 grow"
          custom={direction}
          initial="enter"
          animate="center"
          exit="exit"
          onAnimationComplete={() => {
            setIsSwiping(false);
          }}
          variants={{
            enter: (direction: number) => ({
              x: direction > 0 ? 300 : -300,
              opacity: 0,
            }),
            center: {
              x: 0,
              opacity: 1,
            },
            exit: (direction: number) => ({
              x: direction > 0 ? -300 : 300,
              opacity: 0,
            }),
          }}
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.3 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            const swipeDistance = info.offset.x;
            const threshold = 100;

            if (swipeDistance > threshold) {
              // Swipe right
              if (viewingHoleNumber > 1) {
                setIsSwiping(true);
                setDirection(-1);
                onPreviousHole();
              } else {
                // At Hole 1: do nothing — Framer Motion will snap it back
              }
            } else if (swipeDistance < -threshold) {
              // Swipe left
              if (viewingHoleNumber < totalHoles) {
                setIsSwiping(true);
                setDirection(1);
                onNextHole();
              } else {
                const confirmed = confirm("Finish the game?");
                if (confirmed) {
                  setIsSwiping(true);
                  onFinishGame();
                }
              }
            }
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
