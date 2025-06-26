"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/app/components/spinner";
import { createClient } from "@/utils/supabase/client";
import { russoOne } from "@/app/ui/fonts";
import { LogOut } from "lucide-react";
import FullScreenLoader from "../components/FullScreenLoader";
import { useSWRConfig } from "swr";
import { useUserStore } from "@/lib/stores/useUserStore";

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
    useUserStore.getState().clearUserPreferences();

    router.push("/login");
  };

  return (
    <>
      <button
        aria-label={isLoading ? "Logging out..." : "Log out"}
        onClick={handleSignOut}
        className={`${russoOne.className} p-2 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 hover:bg-blue-700 hover:scale-95`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 justify-center">
            <Spinner />
            <p>Logging out...</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-center">
            <LogOut />
            <p>Log out</p>
          </div>
        )}
      </button>
      {isLoading && <FullScreenLoader message="Logging out..." />}
    </>
  );
}
