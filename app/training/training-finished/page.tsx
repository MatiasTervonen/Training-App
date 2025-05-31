"use client";

import { russoOne } from "@/app/ui/fonts";
import Image from "next/image";
import Link from "next/link";
import ModalPageWrapper from "@/app/components/modalPageWrapper";
import { useRouter } from "next/navigation";

export default function TrainingFinished() {
  const router = useRouter();

  return (
    <ModalPageWrapper
      noTopPadding
      onSwipeRight={() => router.push("/")}
      leftLabel="home"
      onSwipeLeft={() => router.push("/")}
      rightLabel="home"
    >
      <div className="flex flex-col h-full w-full justify-center px-10 gap-10 bg-slate-900">
        <div className="flex items-center justify-center gap-5">
          <Image src="/Confetti.png" alt="Confetti" width={50} height={50} />
          <h1
            className={`${russoOne.className} text-gray-100 font-bold text-lg`}
          >
            Congratulations!
          </h1>
        </div>
        <p
          className={`${russoOne.className} text-gray-100 text-center font-bold text-lg`}
        >
          You have completed your training session!
        </p>
        <Link
          href="/"
          className={`${russoOne.className} w-full text-center bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
        >
          Done
        </Link>
      </div>
    </ModalPageWrapper>
  );
}
