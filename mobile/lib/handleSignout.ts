import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useUserStore } from "@/lib/stores/useUserStore";
import { clearAsyncStorage } from "@/utils/ClearAsyncStorage";
import { useQueryClient } from "@tanstack/react-query";

export function useSignOut() {
  const logoutUser = useUserStore((state) => state.logoutUser);

  const queryClient = useQueryClient();

  const signOut = async () => {

    // Sign out from supabase
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {}

    // Clear TanStack Query cache
    queryClient.clear();

    // Clear async storage
    await clearAsyncStorage();

    // Clear Zustand store
    logoutUser();

    router.replace("/");
  };

  return { signOut };
}
