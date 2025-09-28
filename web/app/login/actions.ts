"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { checkBotId } from "botid/server";

type AuthActionState = {
  success: boolean;
  message: string;
};

const generateRandomUserName = (email: string) => {
  const prefix = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNumber}`;
};

export async function login(
  prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const verification = await checkBotId();

  if (verification.isBot) {
    console.error("[BotID] Blocked request:", verification);
    return {
      success: false,
      message: "Login failed. Please try again.",
    };
  }

  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function signup(
  prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const verification = await checkBotId();

  if (verification.isBot) {
    return {
      success: false,
      message: "Signup failed. Please try again.",
    };
  }

  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const confirmPassword = formData.get("confirmPassword") as string;

  if (data.password !== confirmPassword) {
    return {
      success: false,
      message: "Passwords do not match.",
    };
  }

  // Proceed with sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
    data
  );

  if (signUpError) {
    return {
      success: false,
      message: signUpError.message || "Something went wrong. Please try again.",
    };
  }

  const userExists = (signUpData?.user?.identities?.length ?? 0) === 0;

  if (userExists) {
    return {
      success: false,
      message: "Email already registered. Please log in.",
    };
  }

  // Create user profile in the database
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.from("users").insert({
    id: signUpData.user!.id,
    email: data.email,
    display_name: generateRandomUserName(data.email), // Default display name
    role: "user",
  });

  if (error) {
    console.error("Error creating user profile:", error);
  }

  return {
    success: true,
    message: "Confirmation email sent. Please check your inbox.",
  };
}
