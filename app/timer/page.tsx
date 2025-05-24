"use client";

import { russoOne } from "../ui/fonts";
import ModalPageWrapper from "../components/modalPageWrapper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
      <div className={`${russoOne.className} bg-slate-950 p-5 h-full relative text-gray-100`}>
        <h1>Timer</h1>
      </div>
    </ModalPageWrapper>
  );
}
