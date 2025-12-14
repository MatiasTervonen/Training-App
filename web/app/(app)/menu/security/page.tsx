"use client";

import CustomInput from "@/app/(app)/ui/CustomInput";
import { useState, useEffect } from "react";
import SaveButtonSpinner from "@/app/(app)/components/buttons/save-button-spinner";
import { createClient } from "@/utils/supabase/client";
import { useSignOut } from "@/app/(app)/lib/handleSignOut";
import { handleError } from "@/app/(app)/utils/handleError";
import { deleteAccount } from "../../database/users";
import { useUserStore } from "../../lib/stores/useUserStore";

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

  const isGuest = useUserStore((state) => state.role === "guest");

  const { signOut } = useSignOut();

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
          error.message || "Failed to update password. Please try again."
        );
        setLoading(false);
        return;
      }

      setSuccessMessage("Password updated successfully! Logging you out...");
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
      setErrorMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "This action cannot be undone. Do you really want to delete your account?"
    );
    if (!confirmed) return;

    if (isDeleteAccount != "DELETE ACCOUNT") {
      setErrorMessage2(
        "Incorrect confirmation text. Type “DELETE ACCOUNT” to proceed."
      );
      return;
    }

    try {
      setLoading2(true);

      await deleteAccount();

      setSuccessMessage2("Account deleted successfully! Logging you out...");

      setTimeout(() => {
        signOut();
      }, 3000);
    } catch {
      setErrorMessage2("Failed to delete account! Please try again.");
      setLoading2(false);
    }
  };

  useEffect(() => {
    setErrorMessage((prev) => (prev ? "" : prev));
  }, [password, confirmPassword]);

  return (
    <div className="page-padding max-w-md mx-auto">
      <h1 className="flex justify-center mb-10 text-2xl">Security Settings</h1>
      <h2 className="mb-5 underline">Reset Password</h2>
      <p className="text-gray-300 mb-5 text-sm">
        After resetting your password, you will be logged out from all devices
        for security reasons. Any unsaved local data on this device may be
        cleared.
      </p>
      <div className="mb-5">
        <CustomInput
          type="password"
          label="New Password"
          placeholder="Enter your new password..."
          value={password}
          setValue={setPassword}
          disabled={loading}
          maxLength={128}
          id="new-password-input"
        />
      </div>
      <CustomInput
        type="password"
        label="Confirm New Password"
        placeholder="Confirm your new password..."
        value={confirmPassword}
        setValue={setConfirmPassword}
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
          label="Save (not allowed)"
        />
      ) : (
        <SaveButtonSpinner
          disabled={loading}
          loading={loading}
          onClick={handleSavePassword}
        />
      )}
      <h2 className="mt-10 underline">Delete Account</h2>
      <p className="my-5 text-gray-300">
        Type “DELETE ACCOUNT” to confirm. All your data will be permanently
        removed and cannot be recovered.
      </p>
      <div>
        <CustomInput
          type="text"
          label="Type: DELETE ACCOUNT"
          placeholder="Type: DELETE ACCOUNT"
          value={isDeleteAccount}
          setValue={setIsDeleteAccount}
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
      <SaveButtonSpinner
        label="Delete account"
        onClick={handleDeleteAccount}
        className="bg-red-600 border-red-400 hover:bg-red-500"
        loading={loading2}
        disabled={loading2}
      />
    </div>
  );
}
