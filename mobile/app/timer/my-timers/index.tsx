import { View } from "react-native";
import AppText from "@/components/AppText";

export default function SettingsScreen() {
  return (
      <View className="flex flex-col items-center my-5">
        <AppText className="text-2xl text-center">My Timers</AppText>
      </View>
  );
}
