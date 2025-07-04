"use client";

import { russoOne } from "../../ui/fonts";
import Link from "next/link";
import { NotebookPen, Dumbbell, Disc, Timer } from "lucide-react";
import ModalPageWrapper from "../components/modalPageWrapper";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTimerStore } from "../lib/stores/timerStore";

export default function Sessions() {
  const router = useRouter();

  const { activeSession } = useTimerStore();

  useEffect(() => {
    if (activeSession) {
      alert(
        "You already have an active session. Finish it before starting a new one."
      );
      router.push("/dashboard");
    }
  }, [router, activeSession]);

  return (
    <ModalPageWrapper
      onSwipeRight={() => router.back()}
      leftLabel="back"
      onSwipeLeft={() => router.back()}
      rightLabel="back"
    >
      <div className="p-5 h-full">
        <h1
          className={`${russoOne.className} text-gray-100 text-center  my-5 text-2xl `}
        >
          Start Session
        </h1>
        <div className="flex flex-col max-w-md mx-auto">
          <Link
            href="/training"
            className={`${russoOne.className} flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
          >
            Gym
            <Dumbbell />
          </Link>

          <Link
            href="/notes"
            className={`${russoOne.className} flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
          >
            Notes
            <NotebookPen />
          </Link>
          <Link
            href="/disc-golf"
            className={`${russoOne.className} flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
          >
            Disc Golf
            <Disc />
          </Link>

          <Link
            href="/timer"
            className={`${russoOne.className} flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
          >
            Timer
            <Timer />
          </Link>
          <Link
            href="/weight"
            className={`${russoOne.className} flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
          >
            Weight Tracker
          </Link>
        </div>
      </div>
    </ModalPageWrapper>
  );
}
