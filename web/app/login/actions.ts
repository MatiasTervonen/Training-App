"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { checkBotId } from "botid/server";

type AuthActionState = {
  success: boolean;
  message: string;
};

export async function login(
  prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const verification = await checkBotId();

  if (verification.isBot) {
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
      message:
        error.message === "Email not confirmed"
          ? "Please verify your email before logging in."
          : "Invalid email or password.",
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

  if (data.password.length < 8) {
    return {
      success: false,
      message: "Password must be at least 8 characters long.",
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

  return {
    success: true,
    message:
      "Email sent! Check your inbox (and spam folder) to verify your account before logging in.",
  };
}

export async function sendPasswordResetEmail(
  prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const verification = await checkBotId();

  if (verification.isBot) {
    return {
      success: false,
      message: "Request failed. Please try again.",
    };
  }

  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
  };

  const { error } = await supabase.auth.resetPasswordForEmail(data.email);

  if (error) {
    return {
      success: false,
      message: error.message || "Something went wrong. Please try again.",
    };
  }

  return {
    success: true,
    message: "Password reset email sent. Please check your inbox.",
  };
}

export async function signInWithGoogle(): Promise<{
  url?: string;
  error?: string;
}> {
  const verification = await checkBotId();

  if (verification.isBot) {
    return { error: "Something went wrong." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return { error: error?.message || "Something went wrong." };
  }

  return { url: data.url };
}

export async function resendEmailVerification(
  prevState: AuthActionState | undefined,
  formData: FormData
) {
  const verification = await checkBotId();

  if (verification.isBot) {
    return {
      success: false,
      message: "Request failed. Please try again.",
    };
  }

  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
  };

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: data.email,
  });

  if (error) {
    return {
      success: false,
      message:
        error.message || "Could not resend verification email. Try again.",
    };
  }

  return {
    success: true,
    message: "Verification email resent. Please check your inbox.",
  };
}
