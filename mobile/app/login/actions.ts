import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

// Generate random username

const generateRandomUserName = (email: string) => {
  const prefix = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNumber}`;
};

// LogIn

type SignInProps = {
  email: string;
  password: string;
  setLoadingMessage: (loadingMessage: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  onSuccess: () => void;
};

export async function signInWithEmail({
  email,
  password,
  setLoadingMessage,
  setLoading,
  setError,
  onSuccess,
}: SignInProps) {
  if (!email || !password) {
    Alert.alert("Please enter your email and password.");
    return;
  }

  setLoadingMessage("Logging in...");
  setLoading(true);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error && error.message === "Email not confirmed") {
    setError("Please verify your email before logging in.");
    Alert.alert("Please verify your email before logging in.");
  } else if (error) {
    Alert.alert(error.message);
  } else {
    onSuccess();
  }

  setLoading(false);
}

// SignUp

type SignUpProps = {
  email: string;
  password: string;
  confirmPassword: string;
  setLoadingMessage: (loadingMessage: string) => void;
  setLoading: (loading: boolean) => void;
  setSuccess: (success: boolean) => void;
  setSignup: (values: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => void;
};

export async function signUpWithEmail({
  email,
  password,
  confirmPassword,
  setLoadingMessage,
  setLoading,
  setSuccess,
  setSignup,
}: SignUpProps) {
  if (!password) {
    Alert.alert("Please enter your password.");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Passwords do not match.");
    return;
  }

  if (password.length < 8) {
    Alert.alert("Password must be at least 8 characters long.");
    return;
  }

  setLoadingMessage("Signing up...");
  setLoading(true);
  const { data: signUpData, error: signupError } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (signupError) {
    Alert.alert(
      signupError.message || "Something went wrong. Please try again."
    );
    setSignup({ email: "", password: "", confirmPassword: "" });
    setLoading(false);
    return;
  }

  const userExists = (signUpData?.user?.identities?.length ?? 0) === 0;

  if (userExists) {
    Alert.alert("Email already registered. Please log in.");
    setSignup({ email: "", password: "", confirmPassword: "" });
    setLoading(false);
    return;
  }

  try {
    const res = await fetch(
      "https://training-app-bay.vercel.app/api/user/insert-user",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${signUpData.session?.access_token}`,
        },
        body: JSON.stringify({
          id: signUpData.user?.id,
          email,
          display_name: generateRandomUserName(email),
        }),
      }
    );

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to delete account");
    }
  } catch (error) {
    console.log("error creating account", error);
    handleError(error, {
      message: "Error inserting account",
      route: "sing up",
      method: "POST",
    });
    Alert.alert("Sign up failed. Please try again!");
    return;
  }

  setLoading(false);
  setSignup({ email: "", password: "", confirmPassword: "" });
  Alert.alert(
    "Verification email sent! Please verify your email before logging in."
  );
  setSuccess(true);
}

// Send password reset email

type PasswordResetEmailProps = {
  forgotPasswordEmail: string;
  setLoadingMessage: (loadingMessage: string) => void;
  setLoading: (loading: boolean) => void;
};

export async function sendPasswordResetEmail({
  forgotPasswordEmail,
  setLoadingMessage,
  setLoading,
}: PasswordResetEmailProps) {
  if (!forgotPasswordEmail) {
    Alert.alert("Please enter your email.");
    return;
  }

  setLoadingMessage("Sending password reset email...");
  setLoading(true);

  const { error } = await supabase.auth.resetPasswordForEmail(
    forgotPasswordEmail
  );

  if (error)
    Alert.alert(error.message || "Something went wrong. Please try again.");
  else Alert.alert("Password reset email sent!");

  setLoading(false);
}

// Resend email verification

type ResendEmailVerificationProps = {
  resendEmail: string;
  setLoadingMessage: (loading: string) => void;
  setLoading: (loading: boolean) => void;
  setSuccess: (success: boolean) => void;
};

export async function resendEmailVerification({
  resendEmail,
  setLoadingMessage,
  setLoading,
  setSuccess,
}: ResendEmailVerificationProps) {
  if (!resendEmail) {
    Alert.alert("Please enter your email.");
    return;
  }

  setLoadingMessage("Resending verification email...");
  setLoading(true);

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: resendEmail,
  });

  if (error)
    Alert.alert(
      error.message || "Could not resend verification email. Try again."
    );

  setLoading(false);
  setSuccess(true);
  Alert.alert("Verification email resent. Please check your inbox.");
}
