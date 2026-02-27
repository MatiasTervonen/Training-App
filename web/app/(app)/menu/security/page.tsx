"use client";

import CustomInput from "@/ui/CustomInput";
import { useEffect, useState } from "react";
import SaveButtonSpinner from "@/components/buttons/save-button-spinner";
import { createClient } from "@/utils/supabase/client";
import { useSignOut } from "@/lib/handleSignOut";
import { handleError } from "@/utils/handleError";
import { deleteAccount } from "@/database/user/delete-account";
import { useUserStore } from "@/lib/stores/useUserStore";
import DeleteButtonSpinner from "@/components/buttons/delete-button-spinner";
import { useTranslation } from "react-i18next";

export default function Page() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage2, setSuccessMessage2] = useState("");
  const [errorMessage2, setErrorMessage2] = useState("");
  const [isDeleteAccount, setIsDeleteAccount] = useState("");

  const { t } = useTranslation("menu");
  const isGuest = useUserStore((state) => state.role === "guest");
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const provider = session?.user?.app_metadata?.provider;
      setIsGoogleUser(provider === "google");
    });
  }, []);

  const { signOut } = useSignOut();

  const handleSavePassword = async () => {
    if (password !== confirmPassword) {
      setErrorMessage(t("security.resetPassword.passwordsDoNotMatch"));
      return;
    }
    if (password.length < 8) {
      setErrorMessage(t("security.resetPassword.passwordTooShort"));
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

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
          error.message || t("security.resetPassword.updateFailed"),
        );
        setLoading(false);
        return;
      }

      setSuccessMessage(t("security.resetPassword.updateSuccess"));
      setErrorMessage("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        signOut();
      }, 3000);
    } catch (error) {
      handleError(error, {
        message: "Unexpected error updating password",
        route: "/api/auth/update-password",
        method: "POST",
      });
      setErrorMessage(t("security.resetPassword.updateFailed"));
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(t("security.deleteAccount.confirmMessage"));
    if (!confirmed) return;

    if (isDeleteAccount !== t("security.deleteAccount.confirmationText")) {
      setErrorMessage2(t("security.deleteAccount.incorrectConfirmation"));
      return;
    }

    try {
      setLoading2(true);

      await deleteAccount();

      setSuccessMessage2(t("security.deleteAccount.deleteSuccess"));

      setTimeout(() => {
        signOut();
      }, 3000);
    } catch {
      setErrorMessage2(t("security.deleteAccount.deleteFailed"));
      setLoading2(false);
    }
  };

  return (
    <div className="page-padding max-w-md mx-auto">
      <h1 className="flex justify-center mb-10 text-2xl">{t("security.title")}</h1>
      {isGoogleUser ? (
        <div className="mb-10">
          <h2 className="mb-5 underline">{t("security.resetPassword.title")}</h2>
          <p className="text-gray-400 ">
            {t("security.googleAccount")}
          </p>
        </div>
      ) : (
        <>
          <h2 className="mb-5 underline">{t("security.resetPassword.title")}</h2>
          <p className="text-gray-300 mb-5 text-sm">
            {t("security.resetPassword.description")}
          </p>
          <div className="mb-5">
            <CustomInput
              type="password"
              label={t("security.resetPassword.newPassword")}
              placeholder={t("security.resetPassword.newPasswordPlaceholder")}
              value={password}
              setValue={(value) => {
                setPassword(value);
                setErrorMessage("");
              }}
              disabled={loading}
              maxLength={128}
              id="new-password-input"
            />
          </div>
          <CustomInput
            type="password"
            label={t("security.resetPassword.confirmPassword")}
            placeholder={t("security.resetPassword.confirmPasswordPlaceholder")}
            value={confirmPassword}
            setValue={(value) => {
              setConfirmPassword(value);
              setErrorMessage("");
            }}
            disabled={loading}
            maxLength={128}
            id="confirm-password-input"
          />
          {successMessage ? (
            <p className="text-green-500 my-5 text-center">{successMessage}</p>
          ) : errorMessage ? (
            <p className="text-red-500 my-5 text-center">{errorMessage}</p>
          ) : (
            <p className="mb-5 text-center invisible">Placeholder</p>
          )}
          {isGuest ? (
            <SaveButtonSpinner
              disabled={isGuest}
              loading={loading}
              onClick={handleSavePassword}
              className="bg-gray-600 border-gray-400 hover:bg-gray-500"
              label={t("security.resetPassword.saveNotAllowed")}
            />
          ) : (
            <SaveButtonSpinner
              disabled={loading}
              loading={loading}
              onClick={handleSavePassword}
            />
          )}
        </>
      )}
      <h2 className="mt-10 underline">{t("security.deleteAccount.title")}</h2>
      <p className="my-5 text-gray-300">
        {t("security.deleteAccount.description")}
      </p>
      <div>
        <CustomInput
          type="text"
          label={t("security.deleteAccount.inputLabel")}
          placeholder={t("security.deleteAccount.inputPlaceholder")}
          value={isDeleteAccount}
          setValue={(value) => {
            setIsDeleteAccount(value);
            setErrorMessage2("");
          }}
          disabled={loading2}
          maxLength={128}
        />
      </div>
      {successMessage2 ? (
        <p className="text-green-500 my-5 text-center">{successMessage2}</p>
      ) : errorMessage2 ? (
        <p className="text-red-500 my-5 text-center">{errorMessage2}</p>
      ) : (
        <p className="mb-5 text-center invisible">Placeholder</p>
      )}
      <DeleteButtonSpinner
        label={t("security.deleteAccount.title")}
        onClick={handleDeleteAccount}
        className="bg-red-600 border-red-400 hover:bg-red-500"
        loading={loading2}
        disabled={loading2}
      />
    </div>
  );
}
