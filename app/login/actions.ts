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

  const userExists = (signUpData?.user?.identities?.length ?? 0) === 0;

  if (userExists) {
    return {
      success: false,
      message: "Email already registered. Please log in.",
    };
  }

  return {
    success: true,
    message: "Confirmation email sent. Please check your inbox.",
  };
}
