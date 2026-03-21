"use client";

import React from "react";
import Spinner from "@/components/spinner";
import { createPortal } from "react-dom";

type FullScreenLoaderProps = {
  message?: string;
};

export default function FullScreenLoader({
  message = "Loading...",
}: FullScreenLoaderProps) {
  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-9000">
      <div className="flex flex-col gap-4 items-center justify-center p-6 rounded-xl text-xl z-10000 bg-slate-900 border-[1.5px] border-slate-600 w-[256px] text-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
        <span className="font-body">{message}</span>
        <Spinner size="w-[40px] h-[40px]" />
      </div>
    </div>,
    document.body
  );
}
