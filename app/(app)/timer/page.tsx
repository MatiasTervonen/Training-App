"use client";

import { russoOne } from "@/app/ui/fonts";
import ModalPageWrapper from "@/app/(app)//components/modalPageWrapper";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TimerPage() {
  const router = useRouter();

  return (
    <ModalPageWrapper
      noTopPadding
      onSwipeRight={() => router.back()}
      leftLabel="back"
      onSwipeLeft={() => router.push("/dashboard")}
      rightLabel="home"
    >
      <div
        className={`${russoOne.className} p-5 h-full relative text-gray-100 max-w-md mx-auto`}
      >
        <h1 className="text-2xl text-center my-5 ">Timer</h1>
        <div className="flex flex-col max-w-md mx-auto">
          <Link
            href="/timer/empty-timer"
            className={`${russoOne.className} flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
          >
            Start empty Timer
          </Link>
          <Link
            href="/timer/create-timer"
            className={`${russoOne.className} flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
          >
            Create Timer
          </Link>
          <Link
            href="/timer/my-timers"
            className={`${russoOne.className} flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
          >
            My-Timers
          </Link>
        </div>
      </div>
    </ModalPageWrapper>
  );
}
