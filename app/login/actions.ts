"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type AuthActionState = {
  success: boolean;
  message: string;
};

export async function login(
  prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
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

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(
  prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
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

  // 🔍 Check if the user already exists by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword(data);

  if (!signInError) {
    return {
      success: false,
      message: "This email is already registered. Please log in instead.",
    };
  }

  // Proceed with sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
    data
  );

  if (signUpError) {
    console.error("SignUp error:", signUpError);
    return {
      success: false,
      message: signUpError.message || "Something went wrong. Please try again.",
    };
  }

  console.log("SignUp success:", signUpData);

  return {
    success: true,
    message: "Confirmation email sent. Please check your inbox.",
  };
}
