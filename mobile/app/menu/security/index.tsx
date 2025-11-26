import { View, Alert, Keyboard, TouchableWithoutFeedback } from "react-native";
import AppText from "@/components/AppText";
import { useState } from "react";
import { useSignOut } from "@/lib/handleSignout";
import { supabase } from "@/lib/supabase";
import AppInput from "@/components/AppInput";
import { handleError } from "@/utils/handleError";
import SaveButtonSpinner from "@/components/buttons/SaveButtonSpinner";
import Toast from "react-native-toast-message";
import PageContainer from "@/components/PageContainer";

export default function SecurityPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

      Toast.show({
        type: "success",
        text1: "Password updated successfully! Logging you out...",
        position: "top",
        visibilityTime: 3000,
      });
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        signOut();
      }, 3000);
    } catch (error) {
      handleError(error, {
        message: "Unexpected error updating password",
        route: "security settings",
        method: "POST",
      });
      Alert.alert("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <PageContainer className="items-center">
        <AppText className="text-2xl my-5">Security Settings</AppText>
        <AppText className="text-xl my-5">Reset Password</AppText>
        <View className="w-full mb-5">
          <AppInput
            label="New Password"
            value={password}
            setValue={setPassword}
            placeholder="Enter new password"
            secureTextEntry
          />
        </View>
        <View className="w-full">
          <AppInput
            label="Confirm Password"
            value={confirmPassword}
            setValue={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
          />
        </View>
        <View className="w-full mt-10">
          <SaveButtonSpinner
            onPress={handleSavePassword}
            label={loading ? "Saving..." : "Save"}
            disabled={loading}
            loading={loading}
          />
        </View>
      </PageContainer>
    </TouchableWithoutFeedback>
  );
}
