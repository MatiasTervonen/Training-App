"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import { useUserStore } from "@/app/(app)/lib/stores/useUserStore";
import { clearLocalStorage } from "../utils/clearLocalStorage";
import { useQueryClient } from "@tanstack/react-query";

export function useSignOut() {
  const router = useRouter();
  const logOutUser = useUserStore((state) => state.logoutUser);

  const queryClient = useQueryClient();

  const signOut = async () => {
    const supabase = createClient();

    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {}

    // Clear TanStack Query cache
    queryClient.clear();

    // Clear Zustand store
    logOutUser();

    //  Clear localStorage
    clearLocalStorage();

    router.replace("/login");
  };

  return { signOut };
}
