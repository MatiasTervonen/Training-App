import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

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
  setSignUpSuccess: (success: boolean) => void;
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
  setSignUpSuccess,
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
      signupError.message || "Something went wrong. Please try again.",
    );
    handleError(signupError, {
      message: "Error logging in as guest",
      route: "guest-login",
      method: "POST",
    });
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

  setLoading(false);
  setSignup({ email: "", password: "", confirmPassword: "" });
  setSignUpSuccess(true);
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

  const { error } =
    await supabase.auth.resetPasswordForEmail(forgotPasswordEmail);

  if (error) {
    Alert.alert(error.message || "Something went wrong. Please try again.");
  } else {
    Alert.alert("Password reset email sent!");
  }

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
      error.message || "Could not resend verification email. Try again.",
    );

  setLoading(false);
  setSuccess(true);
  Alert.alert("Verification email resent. Please check your inbox.");
}

type GuestSignInProps = {
  setLoadingMessage: (loadingMessage: string) => void;
  setLoading: (loading: boolean) => void;
  onSuccess: () => void;
};

export async function guestLogIn({
  setLoadingMessage,
  setLoading,
  onSuccess,
}: GuestSignInProps) {
  setLoadingMessage("Logging in as guest...");
  setLoading(true);

  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    handleError(error, {
      message: "Error logging in as guest",
      route: "actions: guest-login",
      method: "POST",
    });
    Alert.alert("Error logging in as guest");
    setLoading(false);
    return;
  }

  onSuccess();
}
