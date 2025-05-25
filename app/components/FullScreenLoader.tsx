"use client";

import React from "react";
import Spinner from "./spinner";

type FullScreenLoaderProps = {
  message?: string;
};

export default function FullScreenLoader({
  message = "Loading...",
}: FullScreenLoaderProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-100/40 z-[9000]">
      <div className="text-gray-100 text-2xl font-semibold mb-4 animate-pulse z-[10000]">
        {message}
      </div>
      <Spinner size={40} />
    </div>
  );
}
