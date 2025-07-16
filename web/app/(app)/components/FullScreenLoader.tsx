"use client";

import React from "react";
import Spinner from "./spinner";
import { createPortal } from "react-dom";

type FullScreenLoaderProps = {
  message?: string;
};

export default function FullScreenLoader({
  message = "Loading...",
}: FullScreenLoaderProps) {
  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-100/40 z-[9000]">
      <div className="flex flex-col gap-4 items-center justify-center p-4 rounded-xl text-slate-950 text-shadow-slate-950 text-2xl z-[10000] bg-slate-700">
        {message}

        <Spinner size="w-[40px] h-[40px]" />
      </div>
    </div>,
    document.body
  );
}
