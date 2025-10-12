import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/LinkButton";

export default function SettingsScreen() {
  return (
   
      <View className="flex flex-col items-center px-6">
        <AppText className="text-2xl text-center my-5">Timer</AppText>
        <LinkButton label="Create Timer" href="/timer/create-timer" />
        <LinkButton label="Empty Timer" href="/timer/empty-timer" />
        <LinkButton label="My Timers" href="/timer/my-timers" />
      </View>

  );
}
