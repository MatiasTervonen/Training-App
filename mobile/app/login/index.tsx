import { useState, useEffect } from "react";
import {
  Alert,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { supabase } from "@/lib/supabase";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import { useRouter } from "expo-router";
import FullScreenLoader from "@/components/FullScreenLoader";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import GuestLogIn from "@/components/login-signup/guest-login";
import GradientButton from "@/components/buttons/GradientButton";
import ForgotPasswordText from "@/components/login-signup/forgotPassword";
import ModalLogin from "@/components/ModalLogin";
import ResendEmailText from "@/components/login-signup/resendEmail";
import { handleError } from "@/utils/handleError";
import AnimatedButton from "@/components/animatedButton";
import { ArrowLeft } from "lucide-react-native";
import GradientColorText from "@/components/GradientColorText";
import PageContainer from "@/components/PageContainer";

const generateRandomUserName = (email: string) => {
  const prefix = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNumber}`;
};

export default function LoginScreen() {
  const [login, setLogin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [activeForm, setActiveForm] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [modal2Open, setModal2Open] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(0);

  const resetFields = () => {
    setLogin({ email: "", password: "" });
    setSignup({ email: "", password: "", confirmPassword: "" });
    setForgotPasswordEmail("");
    setResendEmail("");
    setError("");
  };

  useEffect(() => {
    translateY.value = withSpring(activeForm ? -screenHeight : 0, {
      damping: 15,
      stiffness: 120,
      mass: 1,
      overshootClamping: false,
      velocity: 0,
    });
  }, [activeForm, screenHeight, translateY]);

  useEffect(() => {
    if (activeForm) {
      setLogin({ email: "", password: "" });
    } else {
      setSignup({ email: "", password: "", confirmPassword: "" });
    }
  }, [activeForm]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const router = useRouter();

  async function signInWithEmail() {
    if (!login.email || !login.password) {
      Alert.alert("Please enter your email and password.");
      return;
    }

    const { email, password } = login;

    setLoadingMessage("Logging in...");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error && error.message === "Email not confirmed") {
      setError("Please verify your email before logging in.");
      Alert.alert("Please verify your email before logging in.");
    }

    if (error) Alert.alert(error.message);
    setLoading(false);

    if (!error) {
      router.push("/dashboard");
    }
  }

  async function signUpWithEmail() {
    if (!signup.email || !signup.password) {
      Alert.alert("Please enter your email and password.");
      return;
    }

    if (signup.password !== signup.confirmPassword) {
      Alert.alert("Passwords do not match.");
      return;
    }

    if (signup.password.length < 8) {
      Alert.alert("Password must be at least 8 characters long.");
      return;
    }

    const { email, password } = signup;

    setLoadingMessage("Signing up...");
    setLoading(true);
    const { data: signUpData, error: signupError } = await supabase.auth.signUp(
      {
        email: email,
        password: password,
      }
    );

    if (signupError) {
      Alert.alert(
        signupError.message || "Something went wrong. Please try again."
      );
      setSignup({ email: "", password: "", confirmPassword: "" });
    }

    const userExists = (signUpData?.user?.identities?.length ?? 0) === 0;

    if (userExists) {
      Alert.alert("Email already registered. Please log in.");
      setSignup({ email: "", password: "", confirmPassword: "" });
    }

    const { error } = await supabase.from("users").insert({
      id: signUpData.user!.id,
      email: email,
      display_name: generateRandomUserName(email), // Default display name
      role: "user",
    });

    if (error) {
      handleError(error, {
        message: "Failed to create user profile",
        route: "/api/auth/signup",
        method: "POST",
      });
    }

    setLoading(false);
    setSignup({ email: "", password: "", confirmPassword: "" });
    Alert.alert(
      "Verification email sent! Please verify your email before logging in."
    );
    setSuccess(true);
  }

  async function sendPasswordResetEmail() {
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

  async function resendEmailVerification() {
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

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <LinearGradient
          colors={["#0f172a", "#0f172a", "#1e3a8a"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          className="flex-1"
        >
          <PageContainer>
            <View className="flex-row items-center justify-between px-6 pt-2 z-50">
              <AnimatedButton
                onPress={() => {
                  console.log("Back pressed");
                  router.push("/");
                }}
                hitSlop={10}
              >
                <View className="flex-row gap-2 items-center">
                  <ArrowLeft color="#f3f4f6" />
                  <AppText>Back</AppText>
                </View>
              </AnimatedButton>

              <GradientColorText style={{ width: 140, height: 36 }}>
                MyTrack
              </GradientColorText>

              <AppText className="min-w-[65.5px]"></AppText>
            </View>
            <Animated.View
              style={[
                animatedStyle,
                {
                  height: screenHeight * 2,
                  position: "absolute",
                  width: "100%",
                },
              ]}
            >
              {/* Login Form */}

              <View
                style={{ height: screenHeight }}
                className="justify-center max-w-md mx-auto w-full"
              >
                <AppInput
                  label="Email"
                  onChangeText={(text) => {
                    setLogin({ ...login, email: text });
                    setSignup({ ...signup, email: "" });
                  }}
                  value={login.email}
                  placeholder="Enter email..."
                  autoCapitalize={"none"}
                  autoComplete="email"
                  textContentType="emailAddress"
                  keyboardType="email-address"
                />
                <View className="mt-4">
                  <AppInput
                    label="Password"
                    onChangeText={(text) =>
                      setLogin({ ...login, password: text })
                    }
                    value={login.password}
                    secureTextEntry={true}
                    placeholder="Enter password..."
                    autoCapitalize={"none"}
                    autoComplete="password"
                    textContentType="password"
                    keyboardType="default"
                  />
                </View>
                <View className="mt-10">
                  <GradientButton
                    label="Log in"
                    onPress={() => signInWithEmail()}
                  />
                </View>
                <View className="mt-10 items-center">
                  <GuestLogIn />
                </View>
                <View className="mt-6 items-center">
                  <ForgotPasswordText onPress={() => setModalOpen(true)} />
                </View>
                {error && (
                  <View className="mt-6 items-center">
                    <ResendEmailText onPress={() => setModal2Open(true)} />
                  </View>
                )}
              </View>

              {/* Sign Up Form */}

              <View
                style={{ height: screenHeight }}
                className="justify-center max-w-md mx-auto w-full"
              >
                <AppInput
                  label="Email"
                  onChangeText={(text) => {
                    setSignup({ ...signup, email: text });
                    setLogin({ ...login, email: "" });
                  }}
                  value={signup.email}
                  placeholder="Enter email..."
                  autoCapitalize={"none"}
                  autoComplete="email"
                  textContentType="emailAddress"
                  keyboardType="email-address"
                />
                <View className="mt-4">
                  <AppInput
                    label="Password"
                    onChangeText={(text) =>
                      setSignup({ ...signup, password: text })
                    }
                    value={signup.password}
                    secureTextEntry={true}
                    placeholder="Enter password..."
                    autoCapitalize={"none"}
                    autoComplete="password"
                    textContentType="password"
                    keyboardType="default"
                  />
                </View>
                <View className="mt-4">
                  <AppInput
                    label="Confirm Password"
                    onChangeText={(text) =>
                      setSignup({ ...signup, confirmPassword: text })
                    }
                    value={signup.confirmPassword}
                    secureTextEntry={true}
                    placeholder="Confirm Password..."
                    autoCapitalize={"none"}
                  />
                </View>
                <View className="mt-10">
                  <GradientButton
                    label="Sign up"
                    onPress={() => signUpWithEmail()}
                  />
                </View>

                {success && (
                  <View className="mt-6 items-center">
                    <ResendEmailText onPress={() => setModal2Open(true)} />
                  </View>
                )}
              </View>
            </Animated.View>

            <View className="absolute bottom-0 left-0 w-full flex flex-col justify-center gap-2 pb-10 px-6">
              <AppText className="text-center mb-5 text-xl">
                {activeForm
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </AppText>
              <View className="max-w-md mx-auto w-full">
                <GradientButton
                  label={activeForm ? "Log in" : "Sign up"}
                  onPress={() => setActiveForm(!activeForm)}
                />
              </View>
            </View>
          </PageContainer>
        </LinearGradient>
      </TouchableWithoutFeedback>

      {/* Modal for Resend email verification */}

      {modal2Open && (
        <ModalLogin
          isOpen={modal2Open}
          onClose={() => {
            setModal2Open(false);
            resetFields();
          }}
        >
          <View className="flex-1 justify-between items-center p-6">
            <View className="gap-5">
              <AppText className="text-xl underline mt-5 text-gray-100 text-center">
                Resend Verification Email
              </AppText>
              <AppText className="text-gray-300 text-center">
                Enter your email and we&apos;ll send you a link to verify your
                email.
              </AppText>
              <AppInput
                label="Email"
                onChangeText={(text) => {
                  setResendEmail(text);
                  setLogin({ ...login, email: "" });
                  setSignup({ ...signup, email: "" });
                }}
                value={resendEmail}
                placeholder="Enter email..."
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
              />
            </View>
            <View className="w-full">
              <GradientButton
                label="Resend Verification Email"
                onPress={async () => {
                  await resendEmailVerification();
                  setModal2Open(false);
                  resetFields();
                }}
              />
            </View>
          </View>
        </ModalLogin>
      )}

      {/* Modal for Forgot Password */}

      {modalOpen && (
        <ModalLogin
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            resetFields();
          }}
        >
          <View className="flex-1 justify-between items-center p-6">
            <View className="gap-5">
              <AppText className="text-xl underline mt-5 text-gray-100 text-center">
                Reset your password
              </AppText>
              <AppText className="text-gray-300 text-center">
                Enter your email and we&apos;ll send you a link to reset your
                password.
              </AppText>
              <AppInput
                label="Email"
                onChangeText={(text) => {
                  setForgotPasswordEmail(text);
                  setLogin({ ...login, email: "" });
                  setSignup({ ...signup, email: "" });
                }}
                value={forgotPasswordEmail}
                placeholder="Enter email..."
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
              />
            </View>
            <View className="w-full">
              <GradientButton
                label="Send Reset Link"
                onPress={async () => {
                  await sendPasswordResetEmail();
                  setModalOpen(false);
                  resetFields();
                }}
              />
            </View>
          </View>
        </ModalLogin>
      )}

      <FullScreenLoader visible={loading} message={loadingMessage} />
    </>
  );
}
