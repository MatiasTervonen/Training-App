"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type GuestLoginResult = { success: false; message: string } | { success: true };

export async function guestLogin(): Promise<GuestLoginResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.GUEST_EMAIL!,
    password: process.env.GUEST_PASSWORD!,
  });

  if (error || !data.session) {
    return {
      success: false,
      message: `Error logging in as guest: ${
        error?.message ?? "No session returned"
      }`,
    };
  }

  redirect("/dashboard");
}
