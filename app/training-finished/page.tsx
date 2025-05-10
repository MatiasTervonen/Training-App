"use client";

import { russoOne } from "@/app/ui/fonts";
import Image from "next/image";
import Link from "next/link";

export default function TrainingFinished() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-950">
      <div className="flex items-center justify-center gap-5 pt-10">
        <Image src="/Confetti.png" alt="Confetti" width={50} height={50} />
        <h1 className={`${russoOne.className} text-gray-100 font-bold text-lg`}>
          Congratulations!
        </h1>
      </div>
      <div className="flex items-center justify-center text-center pt-10 px-2">
        <p className={`${russoOne.className} text-gray-100 font-bold text-lg`}>
          You have completed your training session!
        </p>
      </div>
      <div className="flex items-center justify-center text-center pt-10 px-5">
        <Link
          href="/"
          className={`${russoOne.className}  w-full bg-blue-800 py-2  rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
        >
          Done
        </Link>
      </div>
    </div>
  );
}
