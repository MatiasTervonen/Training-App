import React, { useState } from "react";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeForm, setActiveForm] = useState(false);

  const screenHeight = Dimensions.get("window").height;

  const router = useRouter();

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);

    if (!error) {
      Alert.alert("Login successful!");

      router.push("/dashboard");
    }
  }

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert("Please enter your email and password.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match.");
      return;
    }

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
            <View
              style={{ height: screenHeight }}
              className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out px-6  ${
                activeForm ? "-translate-y-full" : "translate-y-0"
              } mt-32`}
            >
              <AppInput
                label="Email"
                onChangeText={(text) => setEmail(text)}
                value={email}
                placeholder="email@address.com"
                autoCapitalize={"none"}
              />
              <View className="mt-4">
                <AppInput
                  label="Password"
                  onChangeText={(text) => setPassword(text)}
                  value={password}
                  secureTextEntry={true}
                  placeholder="Password"
                  autoCapitalize={"none"}
                />
              </View>
              <View className="mt-10">
                <AppButton title="Log in" onPress={() => signInWithEmail()} />
              </View>
            </View>
            <View
              style={{ height: screenHeight }}
              className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out px-6 ${
                activeForm ? "translate-y-0" : "translate-y-full"
              } mt-32`}
            >
              <View>
                <AppInput
                  label="Email"
                  onChangeText={(text) => setEmail(text)}
                  value={email}
                  placeholder="email@address.com"
                  autoCapitalize={"none"}
                />
                <View className="mt-4">
                  <AppInput
                    label="Password"
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder="Password"
                    autoCapitalize={"none"}
                  />
                </View>
                <View className="mt-4">
                  <AppInput
                    label="Confirm Password"
                    onChangeText={(text) => setConfirmPassword(text)}
                    value={confirmPassword}
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
            </View>
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
