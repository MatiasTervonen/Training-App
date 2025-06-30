"use client";

import { russoOne } from "@/app/ui/fonts";
import ModalPageWrapper from "@/app/(app)//components/modalPageWrapper";
import { useRouter } from "next/navigation";

export default function Timer() {
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
        className={`${russoOne.className} bg-slate-800 p-5 h-full relative text-gray-100`}
      >
        <h1 className="text-2xl text-center my-5">Timer</h1>
        <div className="flex flex-col max-w-md mx-auto">
          <p className="text-gray-300 text-center">
            This page is under construction. Please check back later.
          </p>
        </div>
      </div>
    </ModalPageWrapper>
  );
}
