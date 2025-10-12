"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { checkBotId } from "botid/server";
import { handleError } from "@/app/(app)/utils/handleError";

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
    handleError(error, {
      message: "Failed to create user profile",
      route: "/api/auth/signup",
      method: "POST",
    });
  }

  return {
    success: true,
    message:
      "Verification email sent! Please verify your email before logging in.",
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
