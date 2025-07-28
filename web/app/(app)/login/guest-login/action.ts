"use server";

import { createClient } from "@/utils/supabase/server";

type GuestLoginResult = {
  success: boolean;
  message: string;
  session?: {
    access_token: string;
    refresh_token: string;
  };
};

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

  return {
    success: true,
    message: "Guest login successful",
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  };
}
