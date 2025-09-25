"use client";

import SplashScreen from "./splashScreen";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/app/(app)/components/navbar/navbar";

function isRunningAsPWA() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

export default function RootClientWrapper({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const [showSplash, setShowSplash] = useState(
    !!initialUser && !isRunningAsPWA()
  );

  useEffect(() => {
    if (initialUser) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [initialUser]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
