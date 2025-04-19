"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(prevState: any, formData: FormData) {
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

export async function signup(prevState: any, formData: FormData) {
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

  // Try signing in to see if user exists
  const { error: signInError } = await supabase.auth.signInWithPassword(data);

  if (!signInError) {
    return {
      success: false,
      message: "This email is already registered. Try logging in.",
    };
  }

  // Proceed with sign up
  const { error: signUpError } = await supabase.auth.signUp(data);

  if (signUpError) {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }

  return {
    success: true,
    message: "Confirmation email sent. Please check your inbox.",
  };
}
