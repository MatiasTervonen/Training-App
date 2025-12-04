// This is for api route that my mobile app calls.
"use server";

import { createClient } from "@/utils/supabase/server";
import { checkBotId } from "botid/server";
import { handleError } from "@/app/(app)/utils/handleError";
import { createAdminClient } from "@/utils/supabase/admin";

export type GuestLoginResult =
  | {
      success: true;
      message: string;
    }
  | { success: false; message: string };

const generateRandomUserName = (email: string) => {
  const prefix = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNumber}`;
};

export async function guestLoginMobile(): Promise<GuestLoginResult> {
  const verification = await checkBotId();

  if (verification.isBot) {
    return {
      success: false,
      message: "Login failed. Please try again.",
    };
  }

  const supabase = await createClient();

  const { data: signUpData, error } = await supabase.auth.signInAnonymously();

  if (error) {
    handleError(error, {
      message: "Error logging in as guest",
      route: "/api/auth/guest-login",
      method: "POST",
    });
    return {
      success: false,
      message: "Error logging in as guest, please try again.",
    };
  }

  // Create user profile in the database
  const adminSupabase = createAdminClient();

  const { error: userTableError } = await adminSupabase.from("users").upsert(
    {
      id: signUpData.user!.id,
      email: null,
      display_name: generateRandomUserName("anonymous"), // Default display name
      role: "user",
    },
    { onConflict: "id" }
  );

  if (userTableError) {
    handleError(userTableError, {
      message: "Failed to create user profile",
      route: "/api/auth/signup",
      method: "POST",
    });

    await adminSupabase.auth.admin.deleteUser(signUpData.user!.id, true);

    return {
      success: false,
      message: "Sign up failed. Please try again!",
    };
  }

  return {
    success: true,
    message: "Guest login successful",
  };
}
