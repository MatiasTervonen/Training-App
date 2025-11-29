"use client";

import { motion } from "framer-motion";

export default function AnimatedH1() {
  return (
    <div className="light sm:flex items-center justify-center gap-4">
      <motion.h1
        initial={{ opacity: 0, x: -150 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-3xl sm:text-4xl lg:text-5xl text-center text-nowrap"
      >
        Welcome to the
      </motion.h1>
      <motion.h1
        initial={{ opacity: 0, y: -150 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="text-3xl sm:text-4xl lg:text-5xl text-center bg-linear-to-tr from-[#27aee4] via-[#66ece1] to-[#f3f18d] text-transparent bg-clip-text"
      >
        MyTrack!
      </motion.h1>
    </div>
  );
}
