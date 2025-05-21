"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { SquareArrowLeft } from "lucide-react";
import { SquareArrowRight } from "lucide-react";

export default function ModalPageWrapper({
  children,
  noTopPadding = false,
}: {
  children: ReactNode;
  noTopPadding?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isHomePage = pathname === "/";

  const rightNav = isHomePage
    ? { label: ["S", "E", "S", "S", "I", "O", "N", "S"], path: "/sessions" }
    : { label: ["H", "O", "M", "E"], path: "/" };

  return (
    <div
      className={`relative h-[calc(100dvh-72px)] bg-slate-800 overflow-hidden ${
        noTopPadding ? "" : "pt-[40px]"
      }`}
    >
      <div className="absolute inset-0 z-0 h-screen flex justify-between bg-slate-600 pt-[50px]">
        <div className="flex flex-col items-center gap-2  ml-2">
          <div className="text-gray-400 text-center text-2xl font-bold ">
            <p>H</p>
            <p>O</p>
            <p>M</p>
            <p>E</p>
          </div>
          <SquareArrowLeft size={35} className="text-gray-100/60" />
        </div>

        <div className="flex flex-col items-center gap-2 mr-2">
          <div className="text-gray-400 text-center text-2xl font-bold">
            {rightNav.label.map((letter, index) => (
              <p key={index}>{letter}</p>
            ))}
          </div>
          <SquareArrowRight size={35} className="text-gray-100/60" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          className="absolute z-30 w-full h-full overflow-y-auto bg-gray-900 "
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          drag="x"
          dragElastic={0.2}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            const swipedLeft = info.offset.x < -200;
            const swipedRight = info.offset.x > 200;

            if (isHomePage && swipedLeft) {
              router.push("/sessions");
            } else if (!isHomePage && (swipedRight || swipedLeft)) {
              // Swipe right on sessions page → go back to home
              router.push("/");
            }
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
