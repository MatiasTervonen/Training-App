import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useUserStore } from "@/lib/stores/useUserStore";

export function useSignOut() {
  const logoutUser = useUserStore((state) => state.logoutUser);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      Alert.alert("Logout Failed", error.message);
      return;
    }

    logoutUser();

    router.replace("/");
  };

  return { signOut };
}
