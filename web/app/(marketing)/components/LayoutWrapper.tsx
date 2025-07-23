"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";

export default function LayoutWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  const clearPreferences = useUserStore((state) => state.clearUserPreferences);
  const setIsLoggedIn = useUserStore((state) => state.setIsLoggedIn);
  const setIsGuest = useUserStore((state) => state.setIsGuest);

  useEffect(() => {
    const supabase = createClient();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, user) => {
        if (!user) {
          router.replace("/");
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

  return <div>{children}</div>;
}
