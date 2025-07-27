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
import AppButton from "../components/button";
import AppInput from "../components/AppInput";
import AppText from "../components/AppText";
import { useRouter } from "expo-router";
import FullScreenLoader from "../components/FullScreenLoader";
import { LinearGradient } from "expo-linear-gradient";
import Screen from "../components/Screen";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import GuestLogIn from "./guest-login/guest-login";

export default function LoginScreen() {
  const [login, setLogin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeForm, setActiveForm] = useState(false);

  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(activeForm ? -screenHeight : 0, {
      duration: 500,
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

    const { email, password } = signup;

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

  return (
    <Screen>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-1 justify-between"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <LinearGradient
            colors={["#0f172a", "#0f172a", "#1e3a8a"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            className="flex-1"
          >
            <Animated.View
              style={animatedStyle}
              className={`absolute top-0 left-0 w-full  px-6 mt-32`}
            >
              <View style={{ height: screenHeight }}>
                <AppInput
                  label="Email"
                  onChangeText={(text) => setLogin({ ...login, email: text })}
                  value={login.email}
                  placeholder="email@address.com"
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
                    placeholder="Password"
                    autoCapitalize={"none"}
                  />
                </View>
                <View className="mt-10">
                  <AppButton title="Log in" onPress={() => signInWithEmail()} />
                </View>
                <View className="mt-10">
                  <GuestLogIn />
                </View>
              </View>

              <View style={{ height: screenHeight }}>
                <AppInput
                  label="Email"
                  onChangeText={(text) => setSignup({ ...signup, email: text })}
                  value={signup.email}
                  placeholder="email@address.com"
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
                    placeholder="Password"
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
                    placeholder="Confirm Password"
                    autoCapitalize={"none"}
                  />
                </View>
                <View className="mt-10">
                  <AppButton
                    title="Sign up"
                    onPress={() => signUpWithEmail()}
                  />
                </View>
              </View>
            </Animated.View>
            <View className="absolute bottom-0 left-0 w-full flex flex-col justify-centergap-2 pb-10 px-6">
              <AppText className="text-center mb-5">
                {activeForm
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </AppText>
              <AppButton
                title={activeForm ? "Log in" : "Sign up"}
                onPress={() => setActiveForm(!activeForm)}
              />
            </View>
          </LinearGradient>
        </ScrollView>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={loading} message="Logging in..." />
    </Screen>
  );
}
