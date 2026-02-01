import { useState } from "react";
import FullScreenLoader from "../../components/FullScreenLoader";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";
import { LogOut } from "lucide-react-native";
import { router } from "expo-router";
import { useUserStore } from "@/lib/stores/useUserStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleError } from "@/utils/handleError";
import AppButton from "@/components/buttons/AppButton";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function LogoutButton() {
  const { t } = useTranslation("menu");
  const [isLoading, setIsLoading] = useState(false);

  const logoutUser = useUserStore((state) => state.logoutUser);

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        Alert.alert(t("menu.logoutFailed"), error.message);
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
      Alert.alert(t("menu.logoutFailed"), t("menu.logoutError"));
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
      <AppButton onPress={handleLogout} label={t("menu.logOut")}>
        <LogOut size={20} color="#f3f4f6" />
      </AppButton>
      <FullScreenLoader visible={isLoading} message={t("menu.loggingOut")} />
    </>
  );
}
