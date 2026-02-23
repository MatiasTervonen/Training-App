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
import { useConfirmAction } from "@/lib/confirmAction";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useTranslation } from "react-i18next";

export default function SecurityPage() {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage2, setSuccessMessage2] = useState("");
  const [errorMessage2, setErrorMessage2] = useState("");
  const [isDeleteAccount, setIsDeleteAccount] = useState("");

  const confirmAction = useConfirmAction();

  const { signOut } = useSignOut();

  const isGuest = useUserStore((state) => state.profile?.role === "guest");

  const handleSavePassword = async () => {
    if (password !== confirmPassword) {
      setErrorMessage(t("menu:security.resetPassword.passwordsDoNotMatch"));
      return;
    }

    if (password.length < 8) {
      setErrorMessage(t("menu:security.resetPassword.passwordTooShort"));
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
          error.message || t("menu:security.resetPassword.updateFailed"),
        );
        setLoading(false);
        return;
      }

      setSuccessMessage(t("menu:security.resetPassword.updateSuccess"));
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
      Alert.alert(t("menu:security.resetPassword.updateFailed"));
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeleteAccount !== t("menu:security.deleteAccount.confirmationText")) {
      setErrorMessage2(t("menu:security.deleteAccount.incorrectConfirmation"));
      return;
    }

    const confirmed = await confirmAction({
      title: t("menu:security.deleteAccount.confirmTitle"),
      message: t("menu:security.deleteAccount.confirmMessage"),
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
        `${process.env.EXPO_PUBLIC_API_URL}/api/user/delete-account`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to delete account");
      }

      setSuccessMessage2(t("menu:security.deleteAccount.deleteSuccess"));

      setTimeout(() => {
        signOut();
      }, 3000);
    } catch (error) {
      handleError(error, {
        message: "Error deleting account",
        route: "security settings",
        method: "POST",
      });
      Alert.alert(t("menu:security.deleteAccount.deleteFailed"));
      setLoading2(false);
    }
  };

  return (
    <ScrollView>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <PageContainer className="items-center">
          <AppText className="text-2xl mb-10">
            {t("menu:security.title")}
          </AppText>
          <AppText className="text-xl mb-5 underline">
            {t("menu:security.resetPassword.title")}
          </AppText>
          <AppText className="text-gray-300 mb-5 text-sm">
            {t("menu:security.resetPassword.description")}
          </AppText>
          <View className="w-full mb-5">
            <AppInput
              label={t("menu:security.resetPassword.newPassword")}
              value={password}
              setValue={(value) => {
                setPassword(value);
                setErrorMessage("");
              }}
              placeholder={t(
                "menu:security.resetPassword.newPasswordPlaceholder",
              )}
              secureTextEntry
            />
          </View>
          <View className="w-full mb-5">
            <AppInput
              label={t("menu:security.resetPassword.confirmPassword")}
              value={confirmPassword}
              setValue={(value) => {
                setConfirmPassword(value);
                setErrorMessage("");
              }}
              placeholder={t(
                "menu:security.resetPassword.confirmPasswordPlaceholder",
              )}
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
                label={t("menu:security.resetPassword.saveNotAllowed")}
                disabled={isGuest}
                loading={loading}
                className="bg-gray-600 border-gray-400 hover:bg-gray-500"
              />
            </View>
          ) : (
            <View className="w-full">
              <SaveButtonSpinner
                onPress={handleSavePassword}
                label={loading ? t("common.saving") : t("common.save")}
                disabled={loading}
                loading={loading}
                className="btn-base"
              />
            </View>
          )}

          <AppText className="mt-10 underline text-xl">
            {t("menu:security.deleteAccount.title")}
          </AppText>
          <AppText className="my-5 text-gray-300">
            {t("menu:security.deleteAccount.description")}
          </AppText>
          <View className="w-full mb-5">
            <AppInput
              label={t("menu:security.deleteAccount.inputLabel")}
              placeholder={t("menu:security.deleteAccount.inputPlaceholder")}
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
              label={loading2 ? t("common.deleting") : t("common.delete")}
              disabled={loading2}
              loading={loading2}
              className="btn-danger"
            />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}
