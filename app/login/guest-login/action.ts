"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type GuestLoginResult = {
  success: boolean;
  message: string;
};

export async function guestLogin(): Promise<GuestLoginResult> {
  const supabase = await createClient();

  const data = {
    email: process.env.GUEST_EMAIL!,
    password: process.env.GUEST_PASSWORD!,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return {
      success: false,
      message: "Guest login failed. Please try again.",
    };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
