// This is for api route that my mobile app calls.
"use server";

import { createClient } from "@/utils/supabase/server";

export type GuestLoginResult =
  | {
      success: true;
      message: string;
      session: { access_token: string; refresh_token: string };
    }
  | { success: false; message: string };

export async function guestLoginMobile(): Promise<GuestLoginResult> {
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
