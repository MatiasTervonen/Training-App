"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { checkBotId } from "botid/server";
import { handleError } from "@/app/(app)/utils/handleError";

type GuestLoginResult = { success: false; message: string } | { success: true };

export async function guestLogin(): Promise<GuestLoginResult> {
  const verification = await checkBotId();

  if (verification.isBot) {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.GUEST_EMAIL!,
    password: process.env.GUEST_PASSWORD!,
  });

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

  redirect("/dashboard");
}
