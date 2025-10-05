"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useSWRConfig } from "swr";
import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { clearLocalStorage } from "../utils/clearLocalStorage";

export function useSignOut() {
  const router = useRouter();
  const { cache } = useSWRConfig();
  const logOutUser = useUserStore((state) => state.logoutUser);


  const signOut = async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      console.error("Error logging out:", error.message);
      return;
    }

    // Clear all SWR cache
    if ("clear" in cache && typeof cache.clear === "function") {
      cache.clear();
    }

    logOutUser();

    //  Clear localStorage
    clearLocalStorage();

    router.replace("/login");
  };

  return { signOut };
}
