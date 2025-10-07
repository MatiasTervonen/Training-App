import Image from "next/image";
import { motion } from "framer-motion";

export default function Weight({ isActive }: { isActive: boolean }) {
  return (
    <div className="text-gray-100  pb-20">
      <h2 className="text-3xl sm:text-4xl text-center pt-10">
        Weight Tracking
      </h2>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-20 pt-10 px-5">
        <div className="flex flex-col  max-w-lg bg-slate-900 py-4 px-6 rounded-lg shadow-lg ">
          <p className="text-center rounded-xl lg:text-left text-md sm:text-lg">
            Keep track of your weight and body measurements with MyTrack&apos;s
            Weight Tracking feature. Monitor your progress, set goals, and stay
            motivated on your fitness journey.
          </p>
          <div className="mt-10 flex flex-col items-start gap-4">
            <p>- Track weight</p>
            <p>- See history for every measurement</p>
            <p>- Full analytics over time</p>
            <p>- Set personal goals</p>
          </div>
        </div>
        <motion.div
          initial={false}
          animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 300 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Image
            src="/weight-portrait.webp"
            alt="Gym Image"
            width={300}
            height={608}
            className="rounded-lg shadow-lg"
            priority
          />
        </motion.div>
      </div>
    </div>
  );
}
