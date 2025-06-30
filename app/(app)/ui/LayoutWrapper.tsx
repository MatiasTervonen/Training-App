"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/app/(app)/ui/homepage/navbar";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const noNavbarPaths = ["/login"];

const noAuthCheck = ["/login", "/"];

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const skipAuthCheck = noAuthCheck.includes(pathname);

  const preferences = useUserStore((state) => state.preferences);

  const setPreferences = useUserStore((state) => state.setUserPreferences);

  const showNavbar = !noNavbarPaths.includes(pathname);

  const setIsLoggedIn = useUserStore((state) => state.setIsLoggedIn);

  const clearPreferences = useUserStore((state) => state.clearUserPreferences);

  const setIsGuest = useUserStore((state) => state.setIsGuest);

  useEffect(() => {
    if (skipAuthCheck) return;

    // Check if user is logged in
    const checkUserLoggedIn = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.app_metadata?.role === "guest") {
        setIsGuest(true);
      } else {
        setIsGuest(false);
      }

      if (user) {
        setIsLoggedIn(true);

        if (noNavbarPaths.includes(pathname)) return;

        if (preferences) return;

        try {
          const response = await fetch("/api/settings/get-settings");

          if (!response.ok) {
            throw new Error("Failed to fetch user preferences");
          }

          const data = await response.json();
          setPreferences(data);
          console.log("✅ Preferences set to Zustand:", data);
        } catch (error) {
          console.error("Error fetching user preferences:", error);
          console.log("No preferences fetched (likely not logged in yet)");
        }
      } else {
        console.log("User not logged in, clearing preferences");
        clearPreferences();
        setIsLoggedIn(false);
        setIsGuest(false);
      }
    };

    checkUserLoggedIn();
  }, [
    pathname,
    setIsLoggedIn,
    clearPreferences,
    preferences,
    setPreferences,
    setIsGuest,
    skipAuthCheck,
  ]);

  return (
    <>
      {showNavbar && (
        <div className="fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>
      )}

      <main className={showNavbar ? "pt-[72]" : ""}>{children}</main>
    </>
  );
}
