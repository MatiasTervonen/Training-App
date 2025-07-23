"use client";

import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/app/(app)/components/navbar/navbar";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

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

  const setIsLoggedIn = useUserStore((state) => state.setIsLoggedIn);

  const clearPreferences = useUserStore((state) => state.clearUserPreferences);

  const setIsGuest = useUserStore((state) => state.setIsGuest);

  const router = useRouter();

  const loginPage = pathname === "/login";

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

        if (preferences) return;

        try {
          const response = await fetch("/api/settings/get-settings");

          if (!response.ok) {
            throw new Error("Failed to fetch user preferences");
          }

          const data = await response.json();
          setPreferences(data);
        } catch (error) {
          console.error("Error fetching user preferences:", error);
          console.log("No preferences fetched (likely not logged in yet)");
          toast.error("Failed to load user preferences. Please try again.");
        }
      } else {
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

  useEffect(() => {
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, user) => {
        if (!user) {
          router.replace("/login");
          clearPreferences();
          setIsLoggedIn(false);
          setIsGuest(false);
        } else {
          router.replace("/dashboard");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, clearPreferences, setIsLoggedIn, setIsGuest]);

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      <main className={`${loginPage ? "pt-0" : "pt-[72]"}`}>{children}</main>
    </>
  );
}
