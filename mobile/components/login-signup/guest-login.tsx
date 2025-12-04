import AppText from "../AppText";
import { Alert } from "react-native";
import { router } from "expo-router";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export default function GuestLogIn() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = async () => {
    setIsLoading(true);

    try {
      await supabase.auth.signInAnonymously();

      router.replace("/dashboard");
    } catch (error) {
      Alert.alert("Failed to log in as guest.");
      handleError(error, {
        message: "Error logging in as guest",
        route: "guest-login",
        method: "POST",
      });
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
