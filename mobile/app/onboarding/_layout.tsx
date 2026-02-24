import { Slot } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "react-native";

export default function OnboardingLayout() {
  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <Slot />
    </LinearGradient>
  );
}
