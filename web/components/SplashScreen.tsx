"use client";

import { useAppReadyStore } from "@/lib/stores/useAppReadyStore";
import Image from "next/image";

export default function SplashScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAppReady = useAppReadyStore((state) => state.isAppReady);

  if (!isAppReady) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/app-logos/kurvi_ice_blue_final_copnverted.png"
            alt="Kurvi Logo"
            width={300}
            height={82}
            priority
            className="animate-pulse"
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
