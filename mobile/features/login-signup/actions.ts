import { Alert } from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { t } from "i18next";
import * as WebBrowser from "expo-web-browser";

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
    Alert.alert("", t("login:login.actions.enterEmailAndPassword"));
    return;
  }

  setLoadingMessage(t("login:login.actions.loggingIn"));
  setLoading(true);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error && error.message === "Email not confirmed") {
    setError(t("login:login.actions.verifyEmailFirst"));
    Alert.alert("", t("login:login.actions.verifyEmailFirst"));
    setLoading(false);
  } else if (error) {
    Alert.alert("", error.message);
    setLoading(false);
  } else {
    // Don't setLoading(false) on success — keep the loader visible
    // until onAuthStateChange navigates away from the login page.
    onSuccess();
  }
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
    Alert.alert("", t("login:login.actions.enterPassword"));
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("", t("login:login.actions.passwordsDoNotMatch"));
    return;
  }

  if (password.length < 8) {
    Alert.alert("", t("login:login.actions.passwordTooShort"));
    return;
  }

  setLoadingMessage(t("login:login.actions.signingUp"));
  setLoading(true);
  const { data: signUpData, error: signupError } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (signupError) {
    Alert.alert(
      "",
      signupError.message || t("login:login.actions.somethingWentWrong"),
    );
    handleError(signupError, {
      message: "Error signing up",
      route: "signup",
      method: "POST",
    });
    setSignup({ email: "", password: "", confirmPassword: "" });
    setLoading(false);
    return;
  }

  const userExists = (signUpData?.user?.identities?.length ?? 0) === 0;

  if (userExists) {
    Alert.alert("", t("login:login.actions.emailAlreadyRegistered"));
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
    Alert.alert("", t("login:login.actions.enterEmail"));
    return;
  }

  setLoadingMessage(t("login:login.actions.sendingPasswordReset"));
  setLoading(true);

  const { error } =
    await supabase.auth.resetPasswordForEmail(forgotPasswordEmail);

  if (error) {
    Alert.alert(
      "",
      error.message || t("login:login.actions.somethingWentWrong"),
    );
  } else {
    Alert.alert("", t("login:login.actions.passwordResetSent"));
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
    Alert.alert("", t("login:login.actions.enterEmail"));
    return;
  }

  setLoadingMessage(t("login:login.actions.resendingVerification"));
  setLoading(true);

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: resendEmail,
  });

  if (error)
    Alert.alert("", error.message || t("login:login.actions.couldNotResend"));

  setLoading(false);
  setSuccess(true);
  Alert.alert("", t("login:login.actions.verificationResent"));
}

// Google Sign-In

type GoogleSignInProps = {
  setLoadingMessage: (msg: string) => void;
  setLoading: (loading: boolean) => void;
};

export async function signInWithGoogle({
  setLoadingMessage,
  setLoading,
}: GoogleSignInProps) {
  setLoadingMessage(t("login:login.actions.loggingIn"));
  setLoading(true);

  try {
    const redirectTo = Linking.createURL("/login");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      Alert.alert(
        "",
        error?.message || t("login:login.actions.somethingWentWrong"),
      );
      setLoading(false);
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === "success") {
      const code = new URL(result.url).searchParams.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          Alert.alert("", t("login:login.actions.somethingWentWrong"));
          setLoading(false);
        }
        // Don't setLoading(false) on success — keep the loader visible
        // until onAuthStateChange navigates away from the login page.
      }
    }
  } catch (err) {
    handleError(err, {
      message: "Error signing in with Google",
      route: "google-sign-in",
      method: "POST",
    });
    Alert.alert("", t("login:login.actions.somethingWentWrong"));
    setLoading(false);
  }
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
  setLoadingMessage(t("login:login.actions.loggingInAsGuest"));
  setLoading(true);

  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    handleError(error, {
      message: "Error logging in as guest",
      route: "actions: guest-login",
      method: "POST",
    });
    Alert.alert("", t("login:login.actions.guestLoginError"));
    setLoading(false);
    return;
  }

  onSuccess();
}
