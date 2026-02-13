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
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-100/40 z-9000">
      <div className="flex flex-col gap-4 items-center justify-center p-4 rounded-xl text-xl z-10000 bg-slate-800 border-2 border-blue-500 w-[256px] text-center">
        {message}
        <Spinner size="w-[40px] h-[40px]" />
      </div>
    </div>,
    document.body
  );
}
