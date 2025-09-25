"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    const el = document.getElementById("splash-container");

    if (!el) return;

    if (initialUser && !isRunningAsPWA()) {
      const timer = setTimeout(() => {
        if (el) {
          el.classList.add("fade-out");
          setTimeout(() => el.remove(), 300);
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      // no splash needed, remove immediately
      if (el) el.remove();
    }
  }, [initialUser]);

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
