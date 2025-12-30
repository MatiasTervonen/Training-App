import {
  View,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import AppText from "@/components/AppText";
import { useState } from "react";
import { useSignOut } from "@/lib/handleSignout";
import { supabase } from "@/lib/supabase";
import AppInput from "@/components/AppInput";
import { handleError } from "@/utils/handleError";
import SaveButtonSpinner from "@/components/buttons/SaveButtonSpinner";
import PageContainer from "@/components/PageContainer";
import { confirmAction } from "@/lib/confirmAction";
import { useUserStore } from "@/lib/stores/useUserStore";

export default function SecurityPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage2, setSuccessMessage2] = useState("");
  const [errorMessage2, setErrorMessage2] = useState("");
  const [isDeleteAccount, setIsDeleteAccount] = useState("");

  const { signOut } = useSignOut();

  const isGuest = useUserStore((state) => state.profile?.role === "guest");

  const handleSavePassword = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        handleError(error, {
          message: "Error updating password",
          route: "/api/auth/update-password",
          method: "POST",
        });
        setErrorMessage(
          error.message || "Failed to update password. Please try again."
        );
        setLoading(false);
        return;
      }

      setSuccessMessage("Password updated successfully! Logging you out...");
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
      Alert.alert("Failed to update password! Please try again.");
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeleteAccount !== "DELETE ACCOUNT") {
      setErrorMessage2(
        "Incorrect confirmation text. Type “DELETE ACCOUNT” to proceed."
      );
      return;
    }

    const confirmed = await confirmAction({
      title: "Delete Account",
      message:
        "This action cannot be undone. Do you really want to delete your account?",
    });
    if (!confirmed) return;

    setLoading2(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session || !session.user) {
        throw new Error("Unauthorized");
      }

      const res = await fetch(
        "https://training-app-bay.vercel.app/api/user/delete-account",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to delete account");
      }

      setSuccessMessage2("Account deleted successfully! Logging you out...");

      setTimeout(() => {
        signOut();
      }, 3000);
    } catch (error) {
      handleError(error, {
        message: "Error deleting account",
        route: "security settings",
        method: "POST",
      });
      Alert.alert("Failed to delete account! Please try again.");
      setLoading2(false);
    }
  };

  return (
    <ScrollView>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <PageContainer className="items-center">
          <AppText className="text-2xl mb-10">Security Settings</AppText>
          <AppText className="text-xl mb-5 underline">Reset Password</AppText>
          <AppText className="text-gray-300 mb-5 text-sm">
            After resetting your password, you will be logged out from all
            devices for security reasons. Any unsaved local data on this device
            may be cleared.
          </AppText>
          <View className="w-full mb-5">
            <AppInput
              label="New Password"
              value={password}
              setValue={(value) => {
                setPassword(value);
                setErrorMessage("");
              }}
              placeholder="Enter new password"
              secureTextEntry
            />
          </View>
          <View className="w-full mb-5">
            <AppInput
              label="Confirm Password"
              value={confirmPassword}
              setValue={(value) => {
                setConfirmPassword(value);
                setErrorMessage("");
              }}
              placeholder="Confirm new password"
              secureTextEntry
            />
          </View>
          {successMessage ? (
            <AppText className="text-green-500 mb-5 text-center">
              {successMessage}
            </AppText>
          ) : errorMessage ? (
            <AppText className="text-red-500 mb-5 text-center">
              {errorMessage}
            </AppText>
          ) : (
            <AppText className="mb-5 text-center invisible">
              Placeholder
            </AppText>
          )}
          {isGuest ? (
            <View className="w-full">
              <SaveButtonSpinner
                onPress={handleSavePassword}
                label="Save (not allowed)"
                disabled={isGuest}
                loading={loading}
                className="bg-gray-600 border-gray-400 hover:bg-gray-500"
              />
            </View>
          ) : (
            <View className="w-full">
              <SaveButtonSpinner
                onPress={handleSavePassword}
                label={loading ? "Saving..." : "Save"}
                disabled={loading}
                loading={loading}
              />
            </View>
          )}

          <AppText className="mt-10 underline text-xl">Delete Account</AppText>
          <AppText className="my-5 text-gray-300">
            Type “DELETE ACCOUNT” to confirm. All your data will be permanently
            removed and cannot be recovered.
          </AppText>
          <View className="w-full mb-5">
            <AppInput
              label="Type: DELETE ACCOUNT"
              placeholder="Type: DELETE ACCOUNT"
              value={isDeleteAccount}
              setValue={(value) => {
                setIsDeleteAccount(value);
                setErrorMessage2("");
              }}
            />
          </View>
          {successMessage2 ? (
            <AppText className="text-green-500 mb-5 text-center">
              {successMessage2}
            </AppText>
          ) : errorMessage2 ? (
            <AppText className="text-red-500 mb-5 text-center">
              {errorMessage2}
            </AppText>
          ) : (
            <AppText className="mb-5 text-center invisible">
              Placeholder
            </AppText>
          )}
          <View className="w-full">
            <SaveButtonSpinner
              onPress={handleDeleteAccount}
              label={loading2 ? "Deleting..." : "Delete"}
              disabled={loading2}
              loading={loading2}
              className="bg-red-600 border-red-400"
            />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}
