import React, { useState, useEffect } from "react";
import {
  Alert,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
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
  withTiming,
} from "react-native-reanimated";
import GuestLogIn from "@/components/login-signup/guest-login";
import GradientButton from "@/components/GradientButton";
import ForgotPassword from "@/components/login-signup/forgotPassword";
import ModalForgotPassword from "@/components/ForgotPasswordModal";

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

  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(activeForm ? -screenHeight : 0, {
      duration: 400,
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
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);

    if (!session)
      Alert.alert("Please check your inbox for email verification!");

    setLoading(false);
  }

  async function sendPasswordResetEmail() {
    if (!forgotPasswordEmail) {
      Alert.alert("Please enter your email.");
      return;
    }

    setLoadingMessage("Sending password reset email...");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      forgotPasswordEmail,
      { redirectTo: "mytrack://email-verified" }
    );

    if (error) Alert.alert(error.message);
    else Alert.alert("Password reset email sent!");

    setLoading(false);
  }

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <LinearGradient
            colors={["#0f172a", "#0f172a", "#1e3a8a"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            className="flex-1"
          >
            <AppText className="text-center my-5 text-4xl">MyTrack</AppText>
            <Animated.View
              style={[animatedStyle]}
              className={`absolute top-0 left-0 w-full px-6 h-[200%]`}
            >
              <View style={{ height: screenHeight }} className="justify-center">
                <AppInput
                  label="Email"
                  onChangeText={(text) => setLogin({ ...login, email: text })}
                  value={login.email}
                  placeholder="Enter email..."
                  autoCapitalize={"none"}
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
                  <ForgotPassword onPress={() => setModalOpen(true)} />
                </View>
              </View>

              <View style={{ height: screenHeight }} className="justify-center">
                <AppInput
                  label="Email"
                  onChangeText={(text) => setSignup({ ...signup, email: text })}
                  value={signup.email}
                  placeholder="Enter email..."
                  autoCapitalize={"none"}
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
              </View>
            </Animated.View>
            <View className="absolute bottom-0 left-0 w-full flex flex-col justify-centergap-2 pb-10 px-6">
              <AppText className="text-center mb-5 text-xl">
                {activeForm
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </AppText>
              <GradientButton
                label={activeForm ? "Log in" : "Sign up"}
                onPress={() => setActiveForm(!activeForm)}
              />
            </View>
          </LinearGradient>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Modal for Forgot Password */}

      <ModalForgotPassword
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
      >
        <View className="flex-1 justify-between items-center p-6 text-center gap-5">
          <View className="gap-5">
            <AppText className="text-xl underline mt-5 text-gray-100">
              Reset your password
            </AppText>
            <AppText className="text-gray-300">
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </AppText>
            <AppInput
              label="Email"
              onChangeText={(text) => setForgotPasswordEmail(text)}
              value={forgotPasswordEmail}
              placeholder="Enter email..."
            />
          </View>
          <View className="w-full">
            <GradientButton
              label="Send Reset Link"
              onPress={async () => {
                await sendPasswordResetEmail();
                setModalOpen(false);
                setForgotPasswordEmail("");
              }}
            />
          </View>
        </View>
      </ModalForgotPassword>

      <FullScreenLoader visible={loading} message={loadingMessage} />
    </>
  );
}
