"use client";

import { russoOne } from "../ui/fonts";
import ModalPageWrapper from "../components/modalPageWrapper";
import { useRouter } from "next/navigation";


export default function Timer() {
  const router = useRouter();

  return (
    <ModalPageWrapper
      noTopPadding
      onSwipeRight={() => router.back()}
      leftLabel="back"
      onSwipeLeft={() => router.push("/")}
      rightLabel="home"
    >
      <div className={`${russoOne.className} bg-slate-800 p-5 h-full relative text-gray-100`}>
        <h1 className="text-xl text-center">Timer</h1>
      </div>
    </ModalPageWrapper>
  );
}
