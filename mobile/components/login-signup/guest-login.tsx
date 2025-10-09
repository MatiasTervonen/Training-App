import AppText from "../AppText";
import { Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useState } from "react";

export default function GuestLogIn() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL_PROD}/api/guest-login`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to log in as guest");
      }

      const { access_token, refresh_token } = data.session;

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) throw new Error("Failed to set session in Supabase client");

      router.replace("/dashboard");
    } catch (error) {
      console.error("Error logging in as guest:", error);
      Alert.alert("Failed to log in as guest.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <AppText
        onPress={handleGuestLogin}
        className="text-center text-lg mb-4 underline"
      >
        Log in as a Guest
      </AppText>
      <FullScreenLoader visible={isLoading} message="Logging in as guest..." />
    </>
  );
}
