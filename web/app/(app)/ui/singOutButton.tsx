"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LogOut } from "lucide-react";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { useSWRConfig } from "swr";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";

export default function SignOutButton({
  onSignOut,
}: {
  onSignOut?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { cache } = useSWRConfig();

  const handleSignOut = async () => {
    if (onSignOut) onSignOut();

    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error logging out:", error.message);
      setIsLoading(false);
      return;
    }

    // ✅ Clear all SWR cache
    if ("clear" in cache && typeof cache.clear === "function") {
      cache.clear();
    }

    // ✅ Clear user store
    localStorage.removeItem("user-store");
    localStorage.removeItem("timer-store");

    useUserStore.setState({
      preferences: null,
      isLoggedIn: false,
      isGuest: false,
    });

    router.replace("/");
  };

  return (
    <>
      <button
        aria-label={isLoading ? "Logging out..." : "Log out"}
        onClick={handleSignOut}
        className="py-2 px-6 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 hover:bg-blue-700 hover:scale-95"
      >
        <div className="flex items-center gap-2 justify-center">
          <LogOut />
          <p>Log out</p>
        </div>
      </button>
      {isLoading && <FullScreenLoader message="Logging out..." />}
    </>
  );
}
