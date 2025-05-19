"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { SquareArrowLeft } from "lucide-react";
import { SquareArrowRight } from "lucide-react";

export default function ModalPageWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="relative w-full min-h-screen bg-slate-800">
      <div className="fixed inset-0 z-0 h-screen flex items-center justify-between mx-2">
        <div className="flex flex-col items-center gap-2 ">
          <p className="text-gray-400 text-2xl font-bold ">HOME</p>
          <SquareArrowLeft size={35} className="text-gray-100/60" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-gray-400 text-2xl font-bold">HOME</p>
          <SquareArrowRight size={35} className="text-gray-100/60" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          className="absolute inset-0 z-50 overflow-y-auto bg-gray-900"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 200) {
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
