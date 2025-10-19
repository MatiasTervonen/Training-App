import { useState } from "react";
import FullScreenLoader from "../FullScreenLoader";
import { supabase } from "@/lib/supabase";
import { Alert, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "../AppText";
import { LogOut, View } from "lucide-react-native";
import { router } from "expo-router";
import { useUserStore } from "@/lib/stores/useUserStore";
import { queryClient } from "@/lib/queryClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleError } from "@/utils/handleError";
import AppButton from "../AppButton";

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const logoutUser = useUserStore((state) => state.logoutUser);

  const handleLogout = async () => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        Alert.alert("Logout Failed", error.message);
        setIsLoading(false);
        return;
      }

      // Clear TanStack Query cache
      queryClient.clear();

      await AsyncStorage.clear();

      logoutUser();
      setIsLoading(false);
      router.replace("/");
    } catch (error) {
      Alert.alert("Logout Failed", "An unexpected error occurred.");
      handleError(error, {
        message: "Error during logout",
        route: "LogoutButton.tsx",
        method: "POST",
      });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AppButton onPress={handleLogout} label="Log Out">
        <LogOut size={20} color="#f3f4f6" />
      </AppButton>
      <FullScreenLoader visible={isLoading} message="Logging out..." />
    </>
  );
}
