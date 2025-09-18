"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LogOut } from "lucide-react";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { useSWRConfig } from "swr";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { clearLocalStorage } from "../utils/clearLocalStorage";

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { cache } = useSWRConfig();

  const logOutUser = useUserStore((state) => state.logoutUser);

  const handleSignOut = async () => {
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      console.error("Error logging out:", error.message);
      setIsLoading(false);
      return;
    }

    // Clear all SWR cache
    if ("clear" in cache && typeof cache.clear === "function") {
      cache.clear();
    }

    logOutUser();

    //  Clear localStorage
    clearLocalStorage();

    router.replace("/");
  };

  return (
    <>
      <button
        aria-label="Log out"
        onClick={handleSignOut}
        className="w-full py-2 px-6 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 hover:bg-blue-700 hover:scale-105"
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
