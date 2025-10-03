"use client";

import { motion } from "framer-motion";

export default function AnimatedH1() {
  return (
    <div className="sm:flex items-center justify-center">
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
        className="text-3xl sm:text-4xl lg:text-5xl text-center px-4 rounded-md bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
      >
        MyTrack!
      </motion.h1>
    </div>
  );
}
