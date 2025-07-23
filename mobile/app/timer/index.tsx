import { View } from "react-native";
import AppText from "../components/AppText";

export default function SettingsScreen() {
  return (
    <View className="flex flex-col items-center justify-center h-screen">
      <AppText className="text-6xl text-center">Timer</AppText>
    </View>
  );
}