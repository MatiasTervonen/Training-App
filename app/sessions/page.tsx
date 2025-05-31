"use client";

import { russoOne } from "../ui/fonts";
import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { Dumbbell } from "lucide-react";
import { Disc } from "lucide-react";
import { Footprints } from "lucide-react";
import ModalPageWrapper from "../components/modalPageWrapper";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Timer } from "lucide-react";

export default function Sessions() {
  const router = useRouter();

  useEffect(() => {
    const activeSession = localStorage.getItem("activeSession");
    if (activeSession) {
      alert(
        "You already have an active session. Finish it before starting a new one."
      );
      router.push("/");
    }
  }, [router]);

  return (
    <ModalPageWrapper
      noTopPadding
      onSwipeRight={() => router.back()}
      leftLabel="back"
      onSwipeLeft={() => router.push("/")}
      rightLabel="home"
    >
      <div className="bg-slate-800 p-5 h-full">
        <h1
          className={`${russoOne.className} text-gray-100 flex justify-center my-5 text-2xl `}
        >
          Start Session
        </h1>
        <div className="flex flex-col justify-center items-center text-center">
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
            href="/walking"
            className={`${russoOne.className} flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
          >
            Walking
            <Footprints />
          </Link>
          <Link
            href="/timer"
            className={`${russoOne.className} flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
          >
            Timer
            <Timer />
          </Link>
        </div>
      </div>
    </ModalPageWrapper>
  );
}
