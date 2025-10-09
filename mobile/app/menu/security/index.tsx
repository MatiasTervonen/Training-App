import { View, Alert, Keyboard, TouchableWithoutFeedback } from "react-native";
import AppText from "@/components/AppText";
import { useState } from "react";
import { useSignOut } from "@/lib/handleSignout";
import { supabase } from "@/lib/supabase";
import AppInput from "@/components/AppInput";

export default function SecurityPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { signOut } = useSignOut();

  const handleSavePassword = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        Alert.alert(
          error.message || "Failed to update password. Please try again."
        );
        setLoading(false);
      }

      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        signOut();
      }, 3000);
    } catch (error) {
      Alert.alert("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 items-center">
        <AppText className="text-2xl my-5">Security Settings</AppText>
        <AppText className="text-xl my-5">Reset Password</AppText>
        <View className="w-full max-w-md px-5 mb-5">
          <AppInput
            label="New Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter new password"
            secureTextEntry
          />
        </View>
        <View className="w-full max-w-md px-5">
          <AppInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
