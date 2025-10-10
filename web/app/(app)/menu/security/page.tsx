"use client";

import CustomInput from "@/app/(app)/ui/CustomInput";
import { useState } from "react";
import SaveButtonSpinner from "@/app/(app)/ui/save-button-spinner";
import { createClient } from "@/utils/supabase/client";
import { useSignOut } from "@/app/(app)/lib/handleSignOut";
import { handleError } from "@/app/(app)/utils/handleError";
import { useRouter } from "next/navigation";

export default function Page() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

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

      setTimeout(async () => {
        await signOut();
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          window.location.href = "mytrack://";

          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } else {
          router.push("/login");
        }
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

  return (
    <div className="p-5 h-full relative">
      <div className="max-w-md mx-auto">
        <h1 className="text-gray-100 flex justify-center my-5 text-2xl">
          Security Settings
        </h1>
        <h2 className="my-5 text-gray-100">Reset Password</h2>
        <div className="mb-5">
          <CustomInput
            type="password"
            label="New Password"
            placeholder="Enter your new password..."
            value={password}
            setValue={setPassword}
            disabled={loading}
            id="new-password-input"
          />
        </div>
        <div className="mb-5">
          <CustomInput
            type="password"
            label="Confirm New Password"
            placeholder="Confirm your new password..."
            value={confirmPassword}
            setValue={setConfirmPassword}
            disabled={loading}
            id="confirm-password-input"
          />
        </div>
        {successMessage ? (
          <p className="text-green-500 mb-5 text-center">{successMessage}</p>
        ) : errorMessage ? (
          <p className="text-red-500 mb-5 text-center">{errorMessage}</p>
        ) : (
          <p className="mb-5 text-center text-transparent">Placeholder</p>
        )}
        <div>
          <SaveButtonSpinner
            disabled={loading}
            loading={loading}
            onClick={handleSavePassword}
          />
        </div>
      </div>
    </div>
  );
}
