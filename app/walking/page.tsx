"use client";

import { russoOne } from "../ui/fonts";
import ModalPageWrapper from "../components/modalPageWrapper";
import { useRouter } from "next/navigation";

export default function Walking() {
  const router = useRouter();

  return (
    <ModalPageWrapper
      noTopPadding
      onSwipeRight={() => router.back()}
      leftLabel="back"
      onSwipeLeft={() => router.push("/")}
      rightLabel="home"
    >
      <div className="bg-slate-800 p-5 min-h-(calc(100dvh-72px) relative">
        <h1
          className={`${russoOne.className} text-gray-100 flex justify-center my-5 text-2xl `}
        >
          Walking
        </h1>
      </div>
    </ModalPageWrapper>
  );
}
