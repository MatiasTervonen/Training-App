import { useState } from "react";
import FullScreenLoader from "./FullScreenLoader";
import { supabase } from "@/lib/supabase";
import { Alert, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "./AppText";
import { LogOut } from "lucide-react-native";

type LogoutButtonProps = {
  onLogout?: () => void;
};

export default function LogoutButton({ onLogout }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (onLogout) onLogout();

    setIsLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Logout Failed", error.message);
      setIsLoading(false);
      return;
    }
  };

  return (
    <>
      <TouchableOpacity
        className="border-2 border-blue-700 rounded-xl"
        onPress={handleLogout}
      >
        <LinearGradient
          colors={["#020618", "#1447e6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 8 }}
          className="px-4 py-2 flex-row items-center justify-center  gap-2"
        >
          <LogOut size={20} color="#f3f4f6" />
          <AppText className="text-center">Log out</AppText>
        </LinearGradient>
      </TouchableOpacity>
      <FullScreenLoader visible={isLoading} message="Logging out..." />
    </>
  );
}
