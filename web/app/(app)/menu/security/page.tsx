"use client";

import TitleInput from "@/app/(app)/training/components/TitleInput";
import { useState } from "react";
import SaveButtonSpinner from "@/app/(app)/ui/save-button-spinner";
import { createClient } from "@/utils/supabase/client";
import { useSignOut } from "@/app/(app)/lib/handleSignOut";

export default function Page() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
    } catch {
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
          <TitleInput
            type="password"
            label="New Password"
            placeholder="Enter your new password..."
            title={password}
            setTitle={setPassword}
            disabled={loading}
          />
        </div>
        <div className="mb-5">
          <TitleInput
            type="password"
            label="Confirm New Password"
            placeholder="Confirm your new password..."
            title={confirmPassword}
            setTitle={setConfirmPassword}
            disabled={loading}
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
