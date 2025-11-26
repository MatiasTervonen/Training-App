import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useUserStore } from "@/lib/stores/useUserStore";
import { clearAsyncStorage } from "@/utils/ClearAsyncStorage";
import { useQueryClient } from "@tanstack/react-query";

export function useSignOut() {
  const logoutUser = useUserStore((state) => state.logoutUser);

  const queryClient = useQueryClient();

  const signOut = async () => {
    // Sign out from supabase
    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      Alert.alert("Logout Failed", error.message);
      return;
    }

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
